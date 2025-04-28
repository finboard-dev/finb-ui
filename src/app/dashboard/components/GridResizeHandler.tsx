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

// Define resize directions
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

  // Find this item in layouts
  const layoutItem = layouts.find((item) => item.i === itemId);

  if (!layoutItem) return null;

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    resizeDirectionRef.current = direction;

    onResizeStart(itemId, direction);

    // Add global event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !resizeDirectionRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    // Update layout based on resize direction
    const newLayouts = layouts.map((item) => {
      if (item.i !== itemId) return item;

      const dir = resizeDirectionRef.current!;
      const newItem = { ...item };

      // Create a grid cell size approximation (can be adjusted based on your grid)
      const cellW = 20; // Width of one grid cell in pixels (approximate)
      const cellH = 20; // Height of one grid cell in pixels (approximate)

      // Handle horizontal resizing
      if (dir.includes("e")) {
        const widthDelta = Math.round(dx / cellW);
        newItem.w = Math.max(1, item.w + widthDelta);
      } else if (dir.includes("w")) {
        const widthDelta = Math.round(-dx / cellW);
        if (item.w - widthDelta >= 1) {
          newItem.w = item.w - widthDelta;
          newItem.x = item.x + widthDelta;
        }
      }

      // Handle vertical resizing
      if (dir.includes("s")) {
        const heightDelta = Math.round(dy / cellH);
        newItem.h = Math.max(1, item.h + heightDelta);
      } else if (dir.includes("n")) {
        const heightDelta = Math.round(-dy / cellH);
        if (item.h - heightDelta >= 1) {
          newItem.h = item.h - heightDelta;
          newItem.y = item.y + heightDelta;
        }
      }

      return newItem;
    });

    setLayouts(newLayouts);
    startPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    resizeDirectionRef.current = null;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    onResizeEnd();
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      {/* North */}
      <div
        className="absolute top-0 left-4 right-4 h-2 cursor-n-resize"
        onMouseDown={(e) => handleMouseDown(e, "n")}
      />

      {/* South */}
      <div
        className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
        onMouseDown={(e) => handleMouseDown(e, "s")}
      />

      {/* East */}
      <div
        className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
        onMouseDown={(e) => handleMouseDown(e, "e")}
      />

      {/* West */}
      <div
        className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
        onMouseDown={(e) => handleMouseDown(e, "w")}
      />

      {/* North East */}
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
        onMouseDown={(e) => handleMouseDown(e, "ne")}
      />

      {/* North West */}
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={(e) => handleMouseDown(e, "nw")}
      />

      {/* South East */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => handleMouseDown(e, "se")}
      />

      {/* South West */}
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
        onMouseDown={(e) => handleMouseDown(e, "sw")}
      />
    </>
  );
};

export default GridResizeHandler;
