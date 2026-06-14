interface CacheEntry {
  data: any;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry>();

export const memoryCache = {
  get(key: string, ttlMs: number): any | null {
    const entry = cacheMap.get(key);
    if (entry && Date.now() - entry.timestamp < ttlMs) {
      return entry.data;
    }
    if (entry) {
      cacheMap.delete(key);
    }
    return null;
  },

  set(key: string, data: any): void {
    cacheMap.set(key, { data, timestamp: Date.now() });
  },

  clear(): void {
    cacheMap.clear();
  }
};
