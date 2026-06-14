interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry<unknown>>();

export const memoryCache = {
  get<T = unknown>(key: string, ttlMs: number): T | null {
    const entry = cacheMap.get(key);
    if (entry && Date.now() - entry.timestamp < ttlMs) {
      return entry.data as T;
    }
    if (entry) {
      cacheMap.delete(key);
    }
    return null;
  },

  set<T = unknown>(key: string, data: T): void {
    cacheMap.set(key, { data, timestamp: Date.now() });
  },

  clear(): void {
    cacheMap.clear();
  }
};
