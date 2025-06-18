const sampleData = {
    barChart: {
        title: {
            text: 'Dual Axis Stacked Bar and Line Chart'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        legend: {
            data: ['Line 1', 'Line 2', 'Bar A', 'Bar B', 'Bar C']
        },
        xAxis: [
            {
                type: 'category',
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: 'Bar Values',
                min: -100,
                max: 100,
                interval: 50,
                axisLabel: {
                    formatter: '{value}'
                }
            },
            {
                type: 'value',
                name: 'Line Values',
                min: -50,
                max: 50,
                interval: 25,
                axisLabel: {
                    formatter: '{value}'
                }
            }
        ],
        series: [
            {
                name: 'Line 1',
                type: 'line',
                yAxisIndex: 1,
                data: [20, -15, 30, -25, 40, -10, 15, 35, -20, 25, -30, 10],
                smooth: true,
                lineStyle: {
                    width: 2
                },
                itemStyle: {
                    color: '#FF5733'
                }
            },
            {
                name: 'Line 2',
                type: 'line',
                yAxisIndex: 1,
                data: [-10, 25, -20, 15, -30, 20, -25, 10, -15, 30, -20, 15],
                smooth: true,
                lineStyle: {
                    width: 2
                },
                itemStyle: {
                    color: '#33C4FF'
                }
            },
            {
                name: 'Bar A',
                type: 'bar',
                stack: 'stack1',
                data: [30, -20, 25, -15, 20, -10, 15, 30, -25, 20, -15, 10],
                itemStyle: {
                    color: '#8884d8'
                }
            },
            {
                name: 'Bar B',
                type: 'bar',
                stack: 'stack1',
                data: [20, -10, 15, -25, 10, -20, 25, 15, -10, 20, -15, 10],
                itemStyle: {
                    color: '#82ca9d'
                }
            },
            {
                name: 'Bar C',
                type: 'bar',
                stack: 'stack1',
                data: [10, -15, 20, -10, 15, -25, 20, 10, -15, 25, -20, 15],
                itemStyle: {
                    color: '#ffc107'
                }
            }
        ]
    },

    lineChart: {
        title: {
            text: 'Dual Axis Complex Chart',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            top: 30,
            data: ['Bar A', 'Bar B', 'Bar C', 'Line X', 'Line Y']
        },
        toolbox: {
            feature: {
                saveAsImage: {},
                dataView: {},
                restore: {}
            }
        },
        xAxis: {
            type: 'category',
            data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        },
        yAxis: [
            {
                type: 'value',
                name: 'Bar Value',
                position: 'left',
                axisLine: {
                    show: true,
                    lineStyle: { color: '#5470C6' }
                },
                splitLine: {
                    show: true
                }
            },
            {
                type: 'value',
                name: 'Line Value',
                position: 'right',
                axisLine: {
                    show: true,
                    lineStyle: { color: '#EE6666' }
                },
                splitLine: {
                    show: false
                }
            }
        ],
        grid: {
            top: 80,
            bottom: 60,
            left: 60,
            right: 60
        },
        series: [
            {
                name: 'Bar A',
                type: 'bar',
                stack: 'Total',
                data: [320, -120, 150, -100, 90, 230],
                itemStyle: { color: '#91cc75' }
            },
            {
                name: 'Bar B',
                type: 'bar',
                stack: 'Total',
                data: [120, 200, -150, 80, -70, 110],
                itemStyle: { color: '#fac858' }
            },
            {
                name: 'Bar C',
                type: 'bar',
                stack: 'Total',
                data: [-60, 50, 120, -40, 60, -30],
                itemStyle: { color: '#73c0de' }
            },
            {
                name: 'Line X',
                type: 'line',
                yAxisIndex: 1,
                data: [500, 400, 350, 420, 390, 450],
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                lineStyle: {
                    color: '#ee6666',
                    width: 2
                }
            },
            {
                name: 'Line Y',
                type: 'line',
                yAxisIndex: 1,
                data: [450, 480, 470, 460, 500, 470],
                smooth: true,
                symbol: 'diamond',
                symbolSize: 8,
                lineStyle: {
                    color: '#5470c6',
                    width: 2
                }
            }
        ]
    },

    pieChart: {
        title: {
            text: 'Complex Dual Axis Chart',
            subtext: 'Positive/Negative Lines with Stacked Triple Bars',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        legend: {
            data: ['Positive Line', 'Negative Line', 'Bar Series 1', 'Bar Series 2', 'Bar Series 3'],
            bottom: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '20%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: 'Line Values',
                min: -100,
                max: 100,
                axisLabel: {
                    formatter: '{value}'
                }
            },
            {
                type: 'value',
                name: 'Bar Values',
                min: 0,
                max: 300,
                axisLabel: {
                    formatter: '{value}'
                }
            }
        ],
        series: [
            // Positive Line Series
            {
                name: 'Positive Line',
                type: 'line',
                yAxisIndex: 0,
                data: [15, 25, 36, 45, 55, 70, 80, 75, 60, 45, 30, 20],
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#4CAF50'
                },
                itemStyle: {
                    color: '#4CAF50'
                },
                markPoint: {
                    data: [
                        { type: 'max', name: 'Max' },
                        { type: 'min', name: 'Min' }
                    ]
                }
            },
            // Negative Line Series
            {
                name: 'Negative Line',
                type: 'line',
                yAxisIndex: 0,
                data: [-10, -25, -15, -5, -30, -45, -20, -15, -25, -35, -50, -40],
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#F44336'
                },
                itemStyle: {
                    color: '#F44336'
                },
                markPoint: {
                    data: [
                        { type: 'max', name: 'Max' },
                        { type: 'min', name: 'Min' }
                    ]
                }
            },
            // First Bar Series (stacked)
            {
                name: 'Bar Series 1',
                type: 'bar',
                yAxisIndex: 1,
                stack: 'bar',
                data: [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
                itemStyle: {
                    color: '#2196F3'
                },
                emphasis: {
                    focus: 'series'
                }
            },
            // Second Bar Series (stacked)
            {
                name: 'Bar Series 2',
                type: 'bar',
                yAxisIndex: 1,
                stack: 'bar',
                data: [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140],
                itemStyle: {
                    color: '#673AB7'
                },
                emphasis: {
                    focus: 'series'
                }
            },
            // Third Bar Series (stacked)
            {
                name: 'Bar Series 3',
                type: 'bar',
                yAxisIndex: 1,
                stack: 'bar',
                data: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130],
                itemStyle: {
                    color: '#FF9800'
                },
                emphasis: {
                    focus: 'series'
                }
            }
        ]
    },

    mixedChart: {
        title: 'Sales & Growth',
        subtitle: 'Monthly Analysis',
        xAxisData: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        yAxisLabel: 'Sales',
        series: [
            {
                name: 'Sales',
                type: 'bar',
                data: [100, 120, 140, 110, 130]
            },
            {
                name: 'Growth %',
                type: 'line',
                data: [20, 25, 30, 22, 28]
            }
        ]
    }
};