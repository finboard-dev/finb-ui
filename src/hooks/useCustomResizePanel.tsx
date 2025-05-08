"use client";

import { useEffect, useRef, useState, RefObject } from 'react';
import {ImperativePanelHandle, PanelResizeHandle} from 'react-resizable-panels';
import { useAppDispatch } from '@/lib/store/hooks';
import { setResponsePanelWidth } from '@/lib/store/slices/chatSlice';

interface CustomResizeHandleProps {
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
}

export function CustomResizeHandle({
                                               onResizeStart,
                                               onResizeEnd
                                           }: CustomResizeHandleProps) {
    return (
        <PanelResizeHandle
            onDragStart={() => {
                if (onResizeStart) onResizeStart();
            }}
            onDragEnd={() => {
                if (onResizeEnd) onResizeEnd();
            }}
            className="w-1 bg-gray-200 hover:bg-gray-300 relative z-50 transition-colors cursor-col-resize"
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-16 flex items-center justify-center">
                <div className="w-1 h-8 bg-gray-400 rounded-full hover:bg-slate-900 transition-colors"></div>
            </div>
        </PanelResizeHandle>
    );
}

/**
 * A custom hook that observes an element's size changes and provides
 * containment within viewport boundaries.
 *
 * @param ref - Reference to the DOM element to observe
 * @param options - Configuration options for the observer
 * @returns - The observed element's dimensions
 */
export function useResizeObserver<T extends HTMLElement>(
    ref: RefObject<T>,
    options: {
        enforceContainment?: boolean;
        horizontalPadding?: number;
        onOverflow?: (isOverflowing: boolean) => void;
    } = {}
) {
    const {
        enforceContainment = true,
        horizontalPadding = 20,
        onOverflow
    } = options;

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isOverflowing, setIsOverflowing] = useState(false);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const checkOverflow = () => {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            const newIsOverflowing = rect.right > viewportWidth - horizontalPadding;

            if (newIsOverflowing !== isOverflowing) {
                setIsOverflowing(newIsOverflowing);
                if (onOverflow) onOverflow(newIsOverflowing);
            }

            // If enforceContainment is true, automatically adjust element width
            if (enforceContainment && newIsOverflowing) {
                const maxWidth = viewportWidth - rect.left - horizontalPadding;
                ref.current.style.maxWidth = `${maxWidth}px`;
            }
        };

        // Create a new ResizeObserver instance
        resizeObserverRef.current = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
                checkOverflow();
            }
        });

        // Start observing the target element
        resizeObserverRef.current.observe(ref.current);

        // Also check on window resize
        window.addEventListener('resize', checkOverflow);

        // Initial check
        checkOverflow();

        // Cleanup function
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            window.removeEventListener('resize', checkOverflow);
        };
    }, [ref, horizontalPadding, enforceContainment, isOverflowing, onOverflow]);

    return dimensions;
}

/**
 * A custom hook that automatically resets panel width if it exceeds viewport boundaries
 *
 * @param panelRef - Reference to the panel component
 * @param activeChatId - ID of the active chat
 * @returns void
 */
export function useAutoResetPanel(
    panelRef: RefObject<ImperativePanelHandle>,
    activeChatId: string | null
) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!panelRef.current || !activeChatId) return;

        // Check if panel exceeds viewport on mount or chat change
        const handleResize = () => {
            if (!panelRef.current) return;

            // @ts-ignore
            const panelElement = panelRef.current.getElement();
            if (!panelElement) return;

            const panelRect = panelElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // Reset panel if it extends beyond viewport
            if (panelRect.right > viewportWidth - 20) {
                const defaultWidth = 35; // Default panel width (%)
                panelRef.current.resize(defaultWidth);
                dispatch(setResponsePanelWidth(defaultWidth));
            }
        };

        // Check on mount and window resize
        handleResize();
        window.addEventListener('resize', handleResize);

        // Initial delay for panel to render completely
        const initialCheck = setTimeout(handleResize, 500);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(initialCheck);
        };
    }, [panelRef, activeChatId, dispatch]);
}