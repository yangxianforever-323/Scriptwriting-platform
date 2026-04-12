import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryCache, requestCache } from "@/lib/cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(1000);
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should check if key exists", () => {
    cache.set("key1", "value1");
    expect(cache.has("key1")).toBe(true);
    expect(cache.has("nonexistent")).toBe(false);
  });

  it("should delete keys", () => {
    cache.set("key1", "value1");
    expect(cache.delete("key1")).toBe(true);
    expect(cache.get("key1")).toBeNull();
  });

  it("should clear all keys", () => {
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it("should respect TTL and expire entries", async () => {
    const shortLivedCache = new MemoryCache(50);
    shortLivedCache.set("tempKey", "tempValue");

    expect(shortLivedCache.get("tempKey")).toBe("tempValue");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(shortLivedCache.get("tempKey")).toBeNull();
  });
});

describe("RequestCache", () => {
  beforeEach(() => {
    requestCache.clear();
  });

  it("should deduplicate concurrent requests", async () => {
    let callCount = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `result-${callCount}`;
    });

    const [result1, result2] = await Promise.all([
      requestCache.deduplicate("test-key", fetcher),
      requestCache.deduplicate("test-key", fetcher),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result1).toBe(result2);
  });

  it("should allow different keys to run in parallel", async () => {
    const fetcher = vi.fn().mockImplementation(async (key: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return `result-${key}`;
    });

    const [result1, result2] = await Promise.all([
      requestCache.deduplicate("key-1", () => fetcher("key-1")),
      requestCache.deduplicate("key-2", () => fetcher("key-2")),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result1).toBe("result-key-1");
    expect(result2).toBe("result-key-2");
  });
});
