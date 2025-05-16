"use client"

import EChartsRenderer from "@/app/components/visualizationV2/VisualizationRenderer";

const config = {
    "title": {
        "text": "Income, Expenses, and Net Income (2024)",
        "subtext": "Monthly Comparison",
        "left": "center"
    },
    "tooltip": {
        "trigger": "axis",
        "axisPointer": {
            "type": "shadow"
        }
    },
    "legend": {
        "data": ["Income", "Expenses", "Net Income"],
        "bottom": 10
    },
    "grid": {
        "left": "3%",
        "right": "4%",
        "bottom": "12%",
        "containLabel": true
    },
    "xAxis": {
        "type": "category",
        "data": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        "axisLabel": {
            "rotate": 45
        }
    },
    "yAxis": {
        "type": "value",
        "name": "Amount ($)",
        "axisLabel": {
            "formatter": "${value}"
        }
    },
    "series": [
        {
            "name": "Income",
            "type": "bar",
            "data": [0, 391.25, 521, 867, 6852.27, 779, 1441, 0, 101, 0, 1532, 1100],
            "itemStyle": {
                "color": "#4CAF50"
            },
            "emphasis": {
                "focus": "series"
            }
        },
        {
            "name": "Expenses",
            "type": "bar",
            "data": [300, 0, 408.08, 511.68, 3158.69, 2308.85, 0, 0, 0, 0, 274, 0],
            "itemStyle": {
                "color": "#F44336"
            },
            "emphasis": {
                "focus": "series"
            }
        },
        {
            "name": "Net Income",
            "type": "bar",
            "data": [-300, 391.25, 112.92, 355.32, 3288.58, -1529.85, 1441, 0, 101, 0, 1257.25, 1100],
            "itemStyle": {
                "color": "#2196F3"
            },
            "emphasis": {
                "focus": "series"
            }
        }
    ],
    "responsive": true
}

const Page = () => {
    return (
       <EChartsRenderer config={config}/>
    )
}

export default Page