import { useCallback, useEffect, useRef, useState } from "react";

interface VirtualizationOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualizationResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetTop: number;
  visibleItems: number[];
  scrollTo: (index: number) => void;
  onScroll: (event: React.UIEvent<HTMLElement>) => void;
}

/**
 * Hook for virtualizing large lists/tables
 * Only renders items that are visible in the viewport + overscan items
 */
export function useVirtualization({
  itemCount,
  itemHeight,
  overscan = 3,
  containerHeight,
}: VirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const totalHeight = itemCount * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(itemCount - 1, startIndex + visibleCount);

  const offsetTop = startIndex * itemHeight;

  // Generate array of visible item indices
  const visibleItems: number[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }

  const onScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
    containerRef.current = target;
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetTop,
    visibleItems,
    scrollTo,
    onScroll,
  };
}

/**
 * Threshold for when to enable virtualization
 * Below this number, we render all rows directly
 */
export const VIRTUALIZATION_THRESHOLD = 50;

/**
 * Default row height for table virtualization
 */
export const DEFAULT_ROW_HEIGHT = 42;

/**
 * Default container height for virtual tables
 */
export const DEFAULT_TABLE_HEIGHT = 400;
