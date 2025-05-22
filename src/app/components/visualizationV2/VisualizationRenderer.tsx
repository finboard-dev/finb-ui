
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface EChartsRendererProps {
    config: EChartsOption;
}

const EChartsRenderer: React.FC<EChartsRendererProps> = ({ config }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.EChartsType | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Initialize with SVG renderer
        chartInstance.current = echarts.init(chartRef.current, undefined, {
            renderer: 'svg',
            useDirtyRect: false
        });

        const resizeObserver = new ResizeObserver(() => {
            chartInstance.current?.resize();
        });

        resizeObserver.observe(chartRef.current);

        return () => {
            resizeObserver.disconnect();
            chartInstance.current?.dispose();
        };
    }, []);

    useEffect(() => {
        if (!chartInstance.current) return;

        // Set responsive options
        const responsiveOptions: EChartsOption = {
            ...config,
            grid: {
                ...config.grid,
                containLabel: true,
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%'
            }
        };

        chartInstance.current.setOption(responsiveOptions);
    }, [config]);

    return (
        <div
            ref={chartRef}
            className="w-full h-full min-h-[400px]"
            style={{ height: '100%', width: '100%' }}
        />
    );
};

export default EChartsRenderer;