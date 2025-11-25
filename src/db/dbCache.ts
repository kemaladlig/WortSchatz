/**
 * Simple in-memory cache for frequently accessed, rarely changed data
 * Used for lessons and scenarios to avoid redundant DB queries
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class DBCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private ttl: number = 5 * 60 * 1000; // 5 minutes default TTL

    set<T>(key: string, data: T, customTTL?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now() + (customTTL || this.ttl),
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.timestamp) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    invalidatePattern(pattern: RegExp): void {
        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                this.cache.delete(key);
            }
        }
    }
}

export const dbCache = new DBCache();
