"use client";

import { useEffect, useRef } from "react";
import { Layout } from "react-grid-layout";

interface GridResizeHandlerProps {
  itemId: string;
  onResizeStart: (id: string, direction: ResizeDirection) => void;
  onResizeEnd: () => void;
  layouts: Layout[];
  setLayouts: (layouts: Layout[]) => void;
}

export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const GridResizeHandler = ({
  itemId,
  onResizeStart,
  onResizeEnd,
  layouts,
  setLayouts,
}: GridResizeHandlerProps) => {
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const resizeDirectionRef = useRef<ResizeDirection | null>(null);
  const accumulatedDeltaRef = useRef({ x: 0, y: 0 });
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUpRef = useRef<() => void>(() => {});

  const layoutItem = layouts.find((item) => item.i === itemId);

  if (!layoutItem) return null;

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    resizeDirectionRef.current = direction;
    accumulatedDeltaRef.current = { x: 0, y: 0 };

    onResizeStart(itemId, direction);

    document.addEventListener("mousemove", handleMouseMoveRef.current);
    document.addEventListener("mouseup", handleMouseUpRef.current);
  };

  handleMouseMoveRef.current = (e: MouseEvent) => {
    if (!isDraggingRef.current || !resizeDirectionRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    // Accumulate deltas for smoother resizing
    accumulatedDeltaRef.current.x += dx;
    accumulatedDeltaRef.current.y += dy;

    const newLayouts = layouts.map((item) => {
      if (item.i !== itemId) return item;

      const dir = resizeDirectionRef.current!;
      const newItem = { ...item };

      // Reduced cell size for more granular resizing (was 20, now 8)
      const cellW = 8;
      const cellH = 8;

      // Use accumulated deltas and apply threshold for smoother resizing
      const accumulatedX = accumulatedDeltaRef.current.x;
      const accumulatedY = accumulatedDeltaRef.current.y;

      if (dir.includes("e")) {
        const widthDelta = Math.round(accumulatedX / cellW);
        if (Math.abs(widthDelta) >= 1) {
          newItem.w = Math.max(item.minW || 1, item.w + widthDelta);
          accumulatedDeltaRef.current.x = accumulatedX % cellW;
        }
      } else if (dir.includes("w")) {
        const widthDelta = Math.round(-accumulatedX / cellW);
        if (
          Math.abs(widthDelta) >= 1 &&
          item.w - widthDelta >= (item.minW || 1)
        ) {
          newItem.w = item.w - widthDelta;
          newItem.x = item.x + widthDelta;
          accumulatedDeltaRef.current.x = accumulatedX % cellW;
        }
      }

      if (dir.includes("s")) {
        const heightDelta = Math.round(accumulatedY / cellH);
        if (Math.abs(heightDelta) >= 1) {
          newItem.h = Math.max(item.minH || 1, item.h + heightDelta);
          accumulatedDeltaRef.current.y = accumulatedY % cellH;
        }
      } else if (dir.includes("n")) {
        const heightDelta = Math.round(-accumulatedY / cellH);
        if (
          Math.abs(heightDelta) >= 1 &&
          item.h - heightDelta >= (item.minH || 1)
        ) {
          newItem.h = item.h - heightDelta;
          newItem.y = item.y + heightDelta;
          accumulatedDeltaRef.current.y = accumulatedY % cellH;
        }
      }

      return newItem;
    });

    setLayouts(newLayouts);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  handleMouseUpRef.current = () => {
    isDraggingRef.current = false;
    resizeDirectionRef.current = null;
    accumulatedDeltaRef.current = { x: 0, y: 0 };

    document.removeEventListener("mousemove", handleMouseMoveRef.current);
    document.removeEventListener("mouseup", handleMouseUpRef.current);

    onResizeEnd();
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMoveRef.current);
      document.removeEventListener("mouseup", handleMouseUpRef.current);
    };
  }, []);

  return (
    <>
      <div
        className="absolute top-0 left-4 right-4 h-2 cursor-n-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "n")}
      />
      <div
        className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "s")}
      />
      <div
        className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "e")}
      />
      <div
        className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "w")}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "ne")}
      />
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "nw")}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "se")}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-200/50 transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "sw")}
      />
    </>
  );
};

export default GridResizeHandler;
