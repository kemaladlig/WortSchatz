import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync('wortschatz.db');
        // Performance optimizations for SQLite
        await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
        await dbInstance.execAsync('PRAGMA synchronous = NORMAL;');
        await dbInstance.execAsync('PRAGMA cache_size = 10000;'); // ~40MB cache
        await dbInstance.execAsync('PRAGMA temp_store = MEMORY;'); // Use memory for temp tables
        await dbInstance.execAsync('PRAGMA mmap_size = 30000000000;'); // Memory-mapped I/O
    }
    return dbInstance;
};
