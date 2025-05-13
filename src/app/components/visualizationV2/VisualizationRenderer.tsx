"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
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
    const [isInitialized, setIsInitialized] = useState(false)

    // Initialize chart only once
    useEffect(() => {
        if (chartRef.current && !chartInstance.current) {
            try {
                chartInstance.current = echarts.init(chartRef.current, theme)

                // Handle resize
                const handleResize = () => {
                    chartInstance.current?.resize()
                }
                window.addEventListener("resize", handleResize)

                setIsInitialized(true)

                return () => {
                    window.removeEventListener("resize", handleResize)
                    chartInstance.current?.dispose()
                    chartInstance.current = null
                    setIsInitialized(false)
                }
            } catch (error) {
                console.error("Error initializing ECharts:", error)
            }
        }
    }, [theme])

    // Update chart options in a separate effect
    useEffect(() => {
        if (chartInstance.current && isInitialized && config) {
            try {
                // Check if config is a valid object
                if (config && typeof config === 'object') {
                    // Use setTimeout to ensure this happens outside the main process
                    setTimeout(() => {
                        if (chartInstance.current) {
                            chartInstance.current.setOption(config, { notMerge: false })
                        }
                    }, 0)
                } else {
                    console.error("Invalid chart config:", config)
                }
            } catch (error) {
                console.error("Error setting chart options:", error)
            }
        }
    }, [config, isInitialized])

    return <div ref={chartRef} className={`w-full h-[500px] ${className}`} style={style} />
}