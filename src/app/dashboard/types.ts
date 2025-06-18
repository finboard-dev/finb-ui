/**
 * Defines the available types for blocks that can be placed on the dashboard.
 * - "graph": For chart visualizations, rendered with a chart component.
 * - "table": For tabular data, rendered with a dynamic table component.
 * - "metric": For displaying key performance indicators, rendered with a metric card.
 */
export type BlockType = "graph" | "table" | "metric";

/**
 * Represents an instance of a block placed on the dashboard grid.
 */
export interface DashboardItem {
    id: string;      // Unique ID for this instance of the block on the dashboard.
    blockId: string; // ID of the source block template.
    x: number;       // X position on the grid.
    y: number;       // Y position on the grid.
    w: number;       // Width on the grid.
    h: number;       // Height on the grid.
    minW: number;    // Minimum width.
    minH: number;    // Minimum height.
}

/**
 * Represents a reusable block template.
 */
export interface Block {
    id: string;           // Unique ID for the block template.
    type: BlockType;
    title: string;
    content: any;         // Data for the block: object for graph/metric, array/object for table.
    previewImage?: string; // Data URL for a preview image.
}

/**
 * Represents a block that is currently being dragged from the controls panel.
 */
export interface DraggingBlock {
    id: string;     // ID of the block template being dragged.
    type: BlockType;
    width: number;  // Default width for the react-grid-layout item.
    height: number; // Default height for the react-grid-layout item.
}
