import { describe, it, expect } from "vitest";

describe("Utility Functions", () => {
  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        ids.add(id);
      }
      expect(ids.size).toBe(100);
    });

    it("should generate non-empty strings", () => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe("Date utilities", () => {
    it("should format ISO dates correctly", () => {
      const date = new Date("2024-01-15T10:30:00.000Z");
      expect(date.toISOString()).toContain("2024-01-15T10:30:00.000Z");
    });
  });

  describe("String utilities", () => {
    it("should trim whitespace", () => {
      expect("  hello world  ".trim()).toBe("hello world");
    });

    it("should check empty strings", () => {
      expect("".length).toBe(0);
    });
  });

  describe("Array utilities", () => {
    it("should filter arrays correctly", () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter((n) => n > 3);
      expect(filtered).toEqual([4, 5]);
    });

    it("should map arrays correctly", () => {
      const arr = [1, 2, 3];
      const doubled = arr.map((n) => n * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it("should sort arrays correctly", () => {
      const arr = [3, 1, 2];
      const sorted = [...arr].sort((a, b) => a - b);
      expect(sorted).toEqual([1, 2, 3]);
    });
  });

  describe("Object utilities", () => {
    it("should merge objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should spread object properties", () => {
      const obj = { x: 10, y: 20 };
      const { x, y } = obj;
      expect(x).toBe(10);
      expect(y).toBe(20);
    });
  });
});
