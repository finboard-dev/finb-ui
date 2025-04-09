// visualizations/types.ts
export type ChartType = 'bar' | 'line' | 'scatter' | 'number' | 'trend' | 'pie';

export interface DataFrame {
  name: string;
  columns: string[];
  data: any[][];
}