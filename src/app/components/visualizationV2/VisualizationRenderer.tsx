
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface EChartsRendererProps {
    config: EChartsOption;
    style?: React.CSSProperties;
}

const EChartsRenderer: React.FC<EChartsRendererProps> = ({ config, style }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.EChartsType | null>(null);

    useEffect(() => {
        // Clean up previous instance
        if (chartInstance.current) {
            chartInstance.current.dispose();
        }

        if (!chartRef.current) return;

        // Initialize chart
        chartInstance.current = echarts.init(chartRef.current, undefined, {
            renderer: 'svg',
            useDirtyRect: false
        });

        // Handle window resize
        const handleResize = () => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        };

        window.addEventListener('resize', handleResize);

        // Set up ResizeObserver for container size changes
        const resizeObserver = new ResizeObserver(() => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        });

        resizeObserver.observe(chartRef.current);

        // Set options with defaults for responsive layout
        const defaultConfig: EChartsOption = {
            grid: {
                containLabel: true,
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '3%'
            },
            ...config
        };

        try {
            chartInstance.current.setOption(defaultConfig);
        } catch (error) {
            console.error('Error setting chart options:', error);
        }

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            if (chartInstance.current) {
                chartInstance.current.dispose();
            }
        };
    }, [config]);

    useEffect(() => {
        // Handle immediate resize after mounting
        const timer = setTimeout(() => {
            if (chartInstance.current) {
                chartInstance.current.resize();
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                ...style
            }}
            className="echarts-visualization"
        />
    );
};

export default React.memo(EChartsRenderer);