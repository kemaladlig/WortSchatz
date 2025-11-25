import { Word } from '@/types';
import { getDB } from './client';
import { dbCache } from './dbCache';
import { CREATE_LESSONS_TABLE, CREATE_PHRASES_TABLE, CREATE_SCENARIOS_TABLE, CREATE_WORDS_TABLE } from './schema';
import starterWords from './seeds/starterWords.json';

import bulkLessons from './seeds/bulk_lessons.json';
import bulkWords from './seeds/bulk_words.json';
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

    // Seed Words if empty
    const resultWords = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM words');
    if (resultWords && resultWords.count === 0) {
        console.log('Seeding words...');
        await db.withTransactionAsync(async () => {
            const statement = await db.prepareAsync(
                'INSERT INTO words (german_word, article, translation, example_sentence) VALUES ($german_word, $article, $translation, $example_sentence)'
            );
            try {
                // Combine starter and bulk words
                const allWords = [...starterWords, ...bulkWords];
                for (const word of allWords) {
                    await statement.executeAsync({
                        $german_word: word.german_word,
                        $article: word.article,
                        $translation: word.translation,
                        $example_sentence: word.example_sentence
                    });
                }
            } finally {
                await statement.finalizeAsync();
            }
        });
        console.log('Words seeded successfully.');
    }

    // Seed Lessons if empty
    const resultLessons = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM lessons');
    if (resultLessons && resultLessons.count === 0) {
        console.log('Seeding lessons...');
        await db.withTransactionAsync(async () => {
            const statement = await db.prepareAsync(
                'INSERT INTO lessons (title, content, order_index) VALUES ($title, $content, $order_index)'
            );
            try {
                const allLessons = bulkLessons;

                for (const lesson of allLessons) {
                    await statement.executeAsync({
                        $title: lesson.title,
                        $content: lesson.content,
                        $order_index: lesson.order_index
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

export const getWords = async (limit = 10): Promise<Word[]> => {
    const db = await getDB();
    // Fetch words with low mastery first, prioritizing least recently reviewed
    // This is MUCH faster than RANDOM() and pedagogically better
    return await db.getAllAsync<Word>(
        'SELECT * FROM words WHERE mastery_level < 5 ORDER BY mastery_level ASC, last_reviewed ASC NULLS FIRST LIMIT ?',
        [limit]
    );
};

export const updateMastery = async (id: number, newLevel: number) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE words SET mastery_level = ?, last_reviewed = ? WHERE id = ?',
        [newLevel, new Date().toISOString(), id]
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
