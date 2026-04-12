interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private defaultTTL: number;

  constructor(defaultTTL = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; force?: boolean }
): Promise<T> {
  const { ttl, force } = options ?? {};

  if (!force && memoryCache.has(key)) {
    const cached = memoryCache.get<T>(key);
    if (cached !== null) return cached;
  }

  const data = await fetcher();
  memoryCache.set(key, data, ttl);
  return data;
}

export function createCachedFetcher<T>(
  keyPrefix: string,
  fetcher: () => Promise<T>,
  defaultTTL?: number
) {
  return (customKey?: string, options?: { ttl?: number; force?: boolean }) => {
    const key = customKey ? `${keyPrefix}:${customKey}` : keyPrefix;
    return withCache(key, fetcher, { ...options, ttl: options?.ttl ?? defaultTTL });
  };
}

export class RequestCache {
  private pendingRequests: Map<string, Promise<unknown>>;

  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const request = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }
}

export const requestCache = new RequestCache();

export function createOptimisticUpdater<T>(
  updateFn: (data: T) => Promise<T>
) {
  return async (
    currentData: T,
    optimisticUpdate: (data: T) => T,
    onOptimisticUpdate?: (data: T) => void,
    onError?: (error: Error, originalData: T) => void
  ): Promise<T> => {
    const optimisticData = optimisticUpdate(currentData);
    onOptimisticUpdate?.(optimisticData);

    try {
      const result = await updateFn(optimisticData);
      return result;
    } catch (error) {
      onError?.(error as Error, currentData);
      throw error;
    }
  };
}
