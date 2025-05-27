export type BlockType =
    | "SQL"
    | "Visualization"
    | "Python"
    | "DashboardHeader";

export interface DashboardItem {
    id: string; // Unique ID for this instance of the block on the dashboard
    blockId: string; // ID of the source block (template)
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
}

export interface Block {
    id: string; // Unique ID for the block template
    type: BlockType;
    title: string;
    content: any; // Can be string for Python, object for Visualization, array/object for SQL
    previewImage?: string; // Data URL or path to a preview image
}

export interface DraggingBlock {
    id: string; // ID of the block template being dragged
    type: BlockType;
    width: number; // Default width to suggest to react-grid-layout
    height: number; // Default height
}