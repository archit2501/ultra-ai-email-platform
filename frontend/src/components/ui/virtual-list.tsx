"use client";

/**
 * Virtual List Component
 *
 * High-performance virtualized list for rendering large datasets.
 * Only renders visible items, dramatically improving performance
 * with hundreds or thousands of items.
 */

import * as React from "react";
import { useVirtualizer, VirtualizerOptions } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of the scrollable container */
  height: number | string;
  /** Estimated height of each row (can be dynamic) */
  estimateSize?: number | ((index: number) => number);
  /** Number of items to render outside visible area */
  overscan?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number, virtualRow: VirtualRow) => React.ReactNode;
  /** Optional key extractor */
  getItemKey?: (item: T, index: number) => string | number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className for container */
  className?: string;
  /** Gap between items */
  gap?: number;
}

export interface VirtualRow {
  key: React.Key;
  index: number;
  start: number;
  size: number;
  measureElement: (node: Element | null) => void;
}

// ============================================
// Virtual List Component
// ============================================

export function VirtualList<T>({
  items,
  height,
  estimateSize = 80,
  overscan = 5,
  renderItem,
  getItemKey,
  isLoading = false,
  emptyMessage = "No items to display",
  className,
  gap = 0,
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof estimateSize === "function" ? estimateSize : () => estimateSize,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start + virtualRow.index * gap}px)`,
              }}
            >
              {renderItem(item, virtualRow.index, {
                key: virtualRow.key,
                index: virtualRow.index,
                start: virtualRow.start,
                size: virtualRow.size,
                measureElement: virtualizer.measureElement,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Virtual Grid Component
// ============================================

export interface VirtualGridProps<T> {
  /** Array of items to render */
  items: T[];
  /** Height of the scrollable container */
  height: number | string;
  /** Number of columns */
  columns: number;
  /** Height of each row */
  rowHeight: number;
  /** Gap between items */
  gap?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional key extractor */
  getItemKey?: (item: T, index: number) => string | number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional className for container */
  className?: string;
}

export function VirtualGrid<T>({
  items,
  height,
  columns,
  rowHeight,
  gap = 16,
  renderItem,
  getItemKey,
  isLoading = false,
  emptyMessage = "No items to display",
  className,
}: VirtualGridProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Calculate number of rows
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
    overscan: 2,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-muted-foreground",
          className
        )}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", className)}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStart = virtualRow.index * columns;
          const rowItems = items.slice(rowStart, rowStart + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                }}
              >
                {rowItems.map((item, colIndex) => {
                  const itemIndex = rowStart + colIndex;
                  return (
                    <div
                      key={
                        getItemKey
                          ? getItemKey(item, itemIndex)
                          : itemIndex
                      }
                    >
                      {renderItem(item, itemIndex)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Hook for External Virtualizer Control
// ============================================

export interface UseVirtualListOptions<T> {
  items: T[];
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function useVirtualList<T>({
  items,
  estimateSize = 80,
  overscan = 5,
  getItemKey,
}: UseVirtualListOptions<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(items[index], index)
      : undefined,
  });

  return {
    parentRef,
    virtualizer,
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    scrollToIndex: virtualizer.scrollToIndex,
    scrollToOffset: virtualizer.scrollToOffset,
    measureElement: virtualizer.measureElement,
  };
}

export default VirtualList;
