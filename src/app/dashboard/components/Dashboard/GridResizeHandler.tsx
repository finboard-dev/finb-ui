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

  const layoutItem = layouts.find((item) => item.i === itemId);

  if (!layoutItem) return null;

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    resizeDirectionRef.current = direction;

    onResizeStart(itemId, direction);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !resizeDirectionRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;

    const newLayouts = layouts.map((item) => {
      if (item.i !== itemId) return item;

      const dir = resizeDirectionRef.current!;
      const newItem = { ...item };

      const cellW = 20;
      const cellH = 20;

      if (dir.includes("e")) {
        const widthDelta = Math.round(dx / cellW);
        newItem.w = Math.max(item.minW || 1, item.w + widthDelta);
      } else if (dir.includes("w")) {
        const widthDelta = Math.round(-dx / cellW);
        if (item.w - widthDelta >= (item.minW || 1)) {
          newItem.w = item.w - widthDelta;
          newItem.x = item.x + widthDelta;
        }
      }

      if (dir.includes("s")) {
        const heightDelta = Math.round(dy / cellH);
        newItem.h = Math.max(item.minH || 1, item.h + heightDelta);
      } else if (dir.includes("n")) {
        const heightDelta = Math.round(-dy / cellH);
        if (item.h - heightDelta >= (item.minH || 1)) {
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
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <>
      <div
        className="absolute top-0 left-4 right-4 h-2 cursor-n-resize"
        onMouseDown={(e) => handleMouseDown(e, "n")}
      />
      <div
        className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
        onMouseDown={(e) => handleMouseDown(e, "s")}
      />
      <div
        className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
        onMouseDown={(e) => handleMouseDown(e, "e")}
      />
      <div
        className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
        onMouseDown={(e) => handleMouseDown(e, "w")}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
        onMouseDown={(e) => handleMouseDown(e, "ne")}
      />
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={(e) => handleMouseDown(e, "nw")}
      />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => handleMouseDown(e, "se")}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
        onMouseDown={(e) => handleMouseDown(e, "sw")}
      />
    </>
  );
};

export default GridResizeHandler;
