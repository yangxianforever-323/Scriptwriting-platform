"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  containerHeight: number;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  overscan = 5,
  className = "",
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === "function" ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const getTotalHeight = useCallback((): number => {
    return items.reduce((total, _, index) => total + getItemHeight(index), 0);
  }, [items, getItemHeight]);

  const getVisibleRange = useCallback(() => {
    let startOffset = 0;
    let startIndex = 0;

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (startOffset + height > scrollTop - overscan * getItemHeight(0)) {
        startIndex = i;
        break;
      }
      startOffset += height;
    }

    let endIndex = startIndex;
    let currentHeight = startOffset;

    for (let i = startIndex; i < items.length; i++) {
      if (currentHeight > scrollTop + containerHeight + overscan * getItemHeight(0)) {
        break;
      }
      currentHeight += getItemHeight(i);
      endIndex = i;
    }

    return { startIndex, endIndex, startOffset };
  }, [scrollTop, containerHeight, items, getItemHeight, overscan]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
    []
  );

  const { startIndex, endIndex, startOffset } = getVisibleRange();
  const visibleItems = items.slice(startIndex, endIndex + 1);

  const offsetY = startIndex > 0
    ? Array.from({ length: startIndex }, (_, i) => getItemHeight(i)).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: getTotalHeight(), position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SimpleVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  containerHeight: number;
  className?: string;
}

export function SimpleVirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  className = "",
}: SimpleVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 3
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: startIndex * itemHeight,
            width: "100%",
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
