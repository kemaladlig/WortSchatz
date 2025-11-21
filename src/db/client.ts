import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync('wortschatz.db');
    }
    return dbInstance;
};
