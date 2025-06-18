import type { EChartsOption } from 'echarts';

export const baseChartOptions: EChartsOption = {
    color: [
        '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
        '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
    ],
    grid: {
        containLabel: true,
        left: '3%',
        right: '4%',
        top: '5%',  // Reduced since title is moved to card
        bottom: '15%', // Space for bottom legend and x-axis labels
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
            color: '#333',
            fontSize: 12,
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        },
    },
    legend: {
        show: true,
        bottom: '3%',
        itemWidth: 15,
        itemHeight: 10,
        textStyle: {
            color: '#495057',
            fontSize: 12,
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
        },
        type: 'scroll',
        pageTextStyle: { color: '#333' },
        pageIconColor: '#333',
        pageIconInactiveColor: '#aaa',
    },
    xAxis: [{
        type: 'category',
        boundaryGap: true,
        axisLine: { show: true, lineStyle: { color: '#ced4da', width: 1 } },
        axisTick: { show: true, alignWithLabel: true, lineStyle: { color: '#ced4da' } },
        axisLabel: {
            color: '#495057',
            fontSize: 11,
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
            margin: 10, // Ensure labels don't overlap visuals
        },
        splitLine: { show: false },
    }],
    yAxis: [{
        type: 'value',
        axisLine: { show: true, lineStyle: { color: '#ced4da', width: 1 } },
        axisTick: { show: false },
        axisLabel: {
            color: '#495057',
            fontSize: 11,
            fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
            margin: 10,
        },
        splitLine: { show: true, lineStyle: { color: '#e9ecef', type: 'dashed' } },
    }],
};