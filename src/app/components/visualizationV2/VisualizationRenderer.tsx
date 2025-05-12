"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface EChartsRendererProps {
    config: any
    className?: string
    style?: React.CSSProperties
    theme?: string | object
}

export default function EChartsRenderer({ config, className = "", style = {}, theme }: EChartsRendererProps) {
    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstance = useRef<echarts.ECharts | null>(null)

    useEffect(() => {
        if (chartRef.current) {
            chartInstance.current = echarts.init(chartRef.current, theme)
            chartInstance.current.setOption(config)
            const handleResize = () => {
                chartInstance.current?.resize()
            }
            window.addEventListener("resize", handleResize)
            return () => {
                window.removeEventListener("resize", handleResize)
                chartInstance.current?.dispose()
            }
        }
    }, [])
    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.setOption(config)
        }
    }, [config])

    return <div ref={chartRef} className={`w-full h-[500px] ${className}`} style={style} />
}
