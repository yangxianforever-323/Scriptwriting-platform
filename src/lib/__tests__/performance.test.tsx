import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDebounce,
  useThrottle,
  useMediaQuery,
  useLocalStorage,
} from "@/lib/performance";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay callback execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    result.current("test");
    
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith("test");
  });

  it("should reset timer on multiple calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    result.current("first");
    act(() => {
      vi.advanceTimersByTime(300);
    });
    result.current("second");
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("second");
  });
});

describe("useThrottle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute immediately on first call", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    result.current("test");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test");
  });

  it("should throttle subsequent calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 500));

    result.current("first");
    result.current("second");
    result.current("third");

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should store and retrieve values", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default-value")
    );

    expect(result.current[0]).toBe("default-value");

    act(() => {
      result.current[1]("new-value");
    });

    expect(result.current[0]).toBe("new-value");
    expect(localStorage.getItem("test-key")).toBe('"new-value"');
  });

  it("should use existing value from localStorage", () => {
    localStorage.setItem("existing-key", JSON.stringify("stored-value"));

    const { result } = renderHook(() =>
      useLocalStorage("existing-key", "default")
    );

    expect(result.current[0]).toBe("stored-value");
  });

  it("should handle function updates", () => {
    const { result } = renderHook(() => useLocalStorage<number>("counter", 0));

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });
});
