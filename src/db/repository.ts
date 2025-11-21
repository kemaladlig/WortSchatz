import { Word } from '@/types';
import { getDB } from './client';
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
    // Fetch words with low mastery first, then random
    return await db.getAllAsync<Word>(
        'SELECT * FROM words WHERE mastery_level < 5 ORDER BY mastery_level ASC, RANDOM() LIMIT ?',
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
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM lessons ORDER BY order_index ASC');
};

export const getLessonById = async (id: number) => {
    const db = await getDB();
    return await db.getFirstAsync('SELECT * FROM lessons WHERE id = ?', [id]);
};

export const markLessonComplete = async (id: number) => {
    const db = await getDB();
    await db.runAsync('UPDATE lessons SET is_completed = 1 WHERE id = ?', [id]);
};

export const getScenarios = async () => {
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM scenarios');
};

export const getScenarioById = async (id: number) => {
    const db = await getDB();
    return await db.getFirstAsync('SELECT * FROM scenarios WHERE id = ?', [id]);
};

export const getPhrasesByScenarioId = async (id: number) => {
    const db = await getDB();
    return await db.getAllAsync('SELECT * FROM phrases WHERE scenario_id = ?', [id]);
};
