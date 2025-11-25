import { Word } from '@/types';
import { getDB } from './client';
import { dbCache } from './dbCache';
import { CREATE_LESSONS_TABLE, CREATE_PHRASES_TABLE, CREATE_SCENARIOS_TABLE, CREATE_WORDS_TABLE } from './schema';

import bulkLessons from './seeds/bulk_lessons.json';
import starterScenarios from './seeds/starterScenarios.json';

export const initDB = async () => {
    const db = await getDB();

    // Create tables
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    ${CREATE_WORDS_TABLE}
    ${CREATE_LESSONS_TABLE}
    ${CREATE_SCENARIOS_TABLE}
    ${CREATE_PHRASES_TABLE}
  `);

    // Create indexes for performance
    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_words_mastery ON words(mastery_level);
        CREATE INDEX IF NOT EXISTS idx_words_last_reviewed ON words(last_reviewed);
        CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(order_index);
        CREATE INDEX IF NOT EXISTS idx_phrases_scenario ON phrases(scenario_id);
    `);

    // Migration: Add 'level' column to words if it doesn't exist
    try {
        await db.execAsync('ALTER TABLE words ADD COLUMN level TEXT DEFAULT "A1"');
    } catch (e) {
        // Column likely exists, ignore
    }

    // Migration: Add 'level' column to lessons if it doesn't exist
    try {
        await db.execAsync('ALTER TABLE lessons ADD COLUMN level TEXT DEFAULT "A1"');
    } catch (e) {
        // Column likely exists, ignore
    }

    // Migration: Add SRS columns
    try {
        await db.execAsync('ALTER TABLE words ADD COLUMN easiness_factor REAL DEFAULT 2.5');
        await db.execAsync('ALTER TABLE words ADD COLUMN interval INTEGER DEFAULT 0');
        await db.execAsync('ALTER TABLE words ADD COLUMN repetitions INTEGER DEFAULT 0');
        await db.execAsync('ALTER TABLE words ADD COLUMN next_review_date DATETIME');
        console.log("Migrated words table: Added SRS columns");
    } catch (e) {
        console.log('Seeding lessons...');
        await db.withTransactionAsync(async () => {
            const statement = await db.prepareAsync(
                'INSERT INTO lessons (title, content, order_index, level) VALUES ($title, $content, $order_index, $level)'
            );
            try {
                const allLessons = bulkLessons;

                for (const lesson of allLessons) {
                    await statement.executeAsync({
                        $title: lesson.title,
                        $content: lesson.content,
                        $order_index: lesson.order_index,
                        $level: (lesson as any).level || 'A1'
                    });
                }
            } finally {
                await statement.finalizeAsync();
            }
        });
        console.log('Lessons seeded successfully.');
    }

    // Seed Scenarios if empty
    const resultScenarios = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM scenarios');
    if (resultScenarios && resultScenarios.count === 0) {
        console.log('Seeding scenarios...');
        await db.withTransactionAsync(async () => {
            const scenarioStmt = await db.prepareAsync(
                'INSERT INTO scenarios (title, icon_name, color_theme) VALUES ($title, $icon_name, $color_theme)'
            );
            const phraseStmt = await db.prepareAsync(
                'INSERT INTO phrases (scenario_id, german_text, english_text) VALUES ($scenario_id, $german_text, $english_text)'
            );

            try {
                for (const scenario of starterScenarios) {
                    const result = await scenarioStmt.executeAsync({
                        $title: scenario.title,
                        $icon_name: scenario.icon_name,
                        $color_theme: scenario.color_theme
                    });
                    const scenarioId = result.lastInsertRowId;

                    for (const phrase of scenario.phrases) {
                        await phraseStmt.executeAsync({
                            $scenario_id: scenarioId,
                            $german_text: phrase.german_text,
                            $english_text: phrase.english_text
                        });
                    }
                }
            } finally {
                await scenarioStmt.finalizeAsync();
                await phraseStmt.finalizeAsync();
            }
        });
        console.log('Scenarios seeded successfully.');
    }
};

export const getWords = async (limit = 10, excludeIds: number[] = []): Promise<Word[]> => {
    const db = await getDB();
    const now = new Date().toISOString();
    const excludeClause = excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.join(',')})` : '';

    // 1. Fetch due reviews (prioritize by due date)
    const reviews = await db.getAllAsync<Word>(
        `SELECT * FROM words
         WHERE next_review_date <= ? ${excludeClause}
         ORDER BY next_review_date ASC
         LIMIT ?`,
        [now, limit]
    );

    if (reviews.length >= limit) {
        return reviews;
    }

    // 2. Fetch new words (mastery_level = 0) if we need more
    // Mix levels to ensure variety: Try to get some A2/B1 if available
    const remaining = limit - reviews.length;

    // We want a mix. Let's try to fetch a few from each level if possible.
    // This is a bit complex in one query without window functions (which SQLite supports but might be overkill).
    // Let's just use RANDOM() but maybe prioritize higher levels slightly?
    // Or simpler: Just fetch random new words. If the DB has a mix, RANDOM() will eventually show them.
    // But user complained about only seeing A1.
    // Let's explicitly try to fetch some non-A1 words first.

    const nonA1Count = Math.floor(remaining * 0.4); // 40% non-A1
    const a1Count = remaining - nonA1Count;

    const newNonA1 = await db.getAllAsync<Word>(
        `SELECT * FROM words
         WHERE mastery_level = 0 AND level != 'A1' ${excludeClause}
         ORDER BY RANDOM()
         LIMIT ?`,
        [nonA1Count]
    );

    const newA1 = await db.getAllAsync<Word>(
        `SELECT * FROM words
         WHERE mastery_level = 0 AND level = 'A1' ${excludeClause}
         ORDER BY RANDOM()
         LIMIT ?`,
        [a1Count + (nonA1Count - newNonA1.length)] // Add unused quota
    );

    // Shuffle the result so they are mixed
    const newWords = [...newNonA1, ...newA1].sort(() => Math.random() - 0.5);

    return [...reviews, ...newWords];
};

export const updateMastery = async (id: number, newLevel: number) => {
    const db = await getDB();

    // Simple Spaced Repetition Intervals (in days)
    // Level 0: New/Forgot -> 0 days (Review immediately/tomorrow)
    // Level 1: 1 day
    // Level 2: 3 days
    // Level 3: 7 days
    // Level 4: 14 days
    // Level 5: 30 days
    const intervals = [0, 1, 3, 7, 14, 30];
    const days = intervals[newLevel] || 0;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);

    // If level is 0, we might want to review it sooner (e.g. same session), 
    // but for now let's say "next session" (which is effectively now if we re-fetch).
    // Actually, if mastery drops to 0, it should probably be reviewable again soon.

    await db.runAsync(
        'UPDATE words SET mastery_level = ?, last_reviewed = ?, next_review_date = ? WHERE id = ?',
        [newLevel, new Date().toISOString(), nextReview.toISOString(), id]
    );
};

export const getStats = async () => {
    const db = await getDB();
    const totalWords = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words');
    const learnedWords = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words WHERE mastery_level > 0');
    const byLevel = await db.getAllAsync<{ level: string, count: number }>('SELECT level, COUNT(*) as count FROM words GROUP BY level');

    return {
        total: totalWords?.count || 0,
        learned: learnedWords?.count || 0,
        byLevel
    };
};

export const getWordsByStatus = async (status: 'learned' | 'new', limit = 50, offset = 0) => {
    const db = await getDB();
    const operator = status === 'learned' ? '>' : '=';
    return await db.getAllAsync<Word>(
        `SELECT * FROM words WHERE mastery_level ${operator} 0 LIMIT ? OFFSET ?`,
        [limit, offset]
    );
};

export const resetProgress = async () => {
    const db = await getDB();
    await db.runAsync('UPDATE words SET mastery_level = 0, last_reviewed = NULL');
};

export const getLessons = async () => {
    // Check cache first
    const cached = dbCache.get<any[]>('lessons');
    if (cached) return cached;

    const db = await getDB();
    const lessons = await db.getAllAsync('SELECT * FROM lessons ORDER BY order_index ASC');

    // Cache for 10 minutes (lessons rarely change)
    dbCache.set('lessons', lessons, 10 * 60 * 1000);
    return lessons;
};

export const getLessonById = async (id: number) => {
    const db = await getDB();
    return await db.getFirstAsync('SELECT * FROM lessons WHERE id = ?', [id]);
};

export const markLessonComplete = async (id: number) => {
    const db = await getDB();
    await db.runAsync('UPDATE lessons SET is_completed = 1 WHERE id = ?', [id]);
    // Invalidate lessons cache
    dbCache.invalidate('lessons');
};

export const getScenarios = async () => {
    // Check cache first
    const cached = dbCache.get<any[]>('scenarios');
    if (cached) return cached;

    const db = await getDB();
    const scenarios = await db.getAllAsync('SELECT * FROM scenarios');

    // Cache for 10 minutes (scenarios rarely change)
    dbCache.set('scenarios', scenarios, 10 * 60 * 1000);
    return scenarios;
};

export const getScenarioById = async (id: number) => {
    const db = await getDB();
    return await db.getFirstAsync('SELECT * FROM scenarios WHERE id = ?', [id]);
};

export const getPhrasesByScenarioId = async (id: number) => {
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM phrases WHERE scenario_id = ?', [id]);
};
