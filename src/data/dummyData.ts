// Example data for the charts
const salesData = [
  { month: "Jan", revenue: 42000, profit: 12400, customers: 190 },
  { month: "Feb", revenue: 35000, profit: 9800, customers: 170 },
  { month: "Mar", revenue: 47000, profit: 14100, customers: 210 },
  { month: "Apr", revenue: 55000, profit: 16500, customers: 240 },
  { month: "May", revenue: 60000, profit: 18000, customers: 260 },
  { month: "Jun", revenue: 52000, profit: 15600, customers: 230 },
  { month: "Jul", revenue: 58000, profit: 17400, customers: 250 },
  { month: "Aug", revenue: 63000, profit: 18900, customers: 270 },
  { month: "Sep", revenue: 59000, profit: 17700, customers: 255 },
  { month: "Oct", revenue: 65000, profit: 19500, customers: 280 },
  { month: "Nov", revenue: 70000, profit: 21000, customers: 295 },
  { month: "Dec", revenue: 78000, profit: 23400, customers: 320 }
];

const productData = [
  { category: "Electronics", product: "Laptops", sales: 420, profit: 126 },
  { category: "Electronics", product: "Phones", sales: 380, profit: 114 },
  { category: "Electronics", product: "Tablets", sales: 210, profit: 63 },
  { category: "Clothing", product: "Shirts", sales: 340, profit: 68 },
  { category: "Clothing", product: "Pants", sales: 290, profit: 58 },
  { category: "Clothing", product: "Shoes", sales: 370, profit: 111 },
  { category: "Home", product: "Furniture", sales: 180, profit: 54 },
  { category: "Home", product: "Decor", sales: 240, profit: 72 },
  { category: "Home", product: "Appliances", sales: 160, profit: 48 }
];

const marketingData = [
  { channel: "Social Media", cost: 12000, leads: 520, conversions: 104 },
  { channel: "Email", cost: 5000, leads: 320, conversions: 96 },
  { channel: "Search", cost: 18000, leads: 650, conversions: 195 },
  { channel: "Display", cost: 9000, leads: 280, conversions: 56 },
  { channel: "Content", cost: 7500, leads: 410, conversions: 82 }
];

const pieData = [
  { category: "Electronics", value: 1010 },
  { category: "Clothing", value: 1000 },
  { category: "Home", value: 580 },
  { category: "Food", value: 750 },
  { category: "Beauty", value: 490 }
];

const timeSeriesData = salesData.map(d => ({
  month: d.month,
  revenue: d.revenue
}));

// Purple-violet-pink color palette
const purpleColors = {
  primary: ["#9d4edd", "#7b2cbf", "#5a189a", "#3c096c", "#240046"],
  secondary: ["#f72585", "#b5179e", "#7209b7", "#560bad", "#480ca8"],
  accent: ["#ff9e00", "#ff7c43", "#f94144", "#e63946", "#d90429"],
  neutrals: ["#2b2d42", "#8d99ae", "#edf2f4"],
  categorical: ["#c77dff", "#9d4edd", "#7b2cbf", "#5a189a", "#ff9e00", "#ff7c43", "#f72585", "#b5179e", "#7209b7"]
};

// Common config for all charts to ensure a consistent modern look
const baseConfig = {
  background: "#faf5ff", // Light purple background
  font: "Inter, system-ui, sans-serif",
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: "#3c096c" // Dark purple for titles
  },
  axis: {
    domainColor: "#e9d8fd", // Light purple for domain
    gridColor: "#e9d8fd", // Light purple for grid
    tickColor: "#9d4edd", // Medium purple for ticks
    labelColor: "#5a189a", // Darker purple for labels
    labelFont: "Inter, system-ui, sans-serif",
    labelFontSize: 12,
    titleFont: "Inter, system-ui, sans-serif",
    titleFontSize: 14,
    titleFontWeight: 500,
    titleColor: "#3c096c" // Dark purple for axis titles
  },
  legend: {
    labelFont: "Inter, system-ui, sans-serif",
    labelFontSize: 12,
    titleFont: "Inter, system-ui, sans-serif",
    titleFontSize: 13,
    titleFontWeight: 500
  },
  view: {
    stroke: null
  }
};

// 1. Enhanced dual-axis composed graph (bar, line, scatter)
export const enhancedDualAxisSpec = {
  title: {
    text: "Monthly Performance Metrics",
    anchor: "middle",
    fontSize: 20,
    font: "sans-serif",
    fontWeight: "bold",
    offset: 10
  },
  width: "container", // Responsive width
  autosize: {
    type: "fit",
    contains: "padding",
    resize: true
  },
  padding: { left: 10, right: 80, top: 30, bottom: 40 }, // Increased right padding for multiple axes
  data: { values: salesData },
  config: baseConfig,
  encoding: {
    x: { 
      field: "month", 
      type: "nominal", 
      title: "Month", 
      sort: null,
      axis: { 
        labelAngle: 0,
        labelPadding: 8,
        tickSize: 0,
        labelFont: "sans-serif",
        labelFontSize: 12,
        title: "Month",
        titleFontSize: 14,
        titlePadding: 15
      }
    }
  },
  layer: [
    {
      // Bar chart for revenue with gradient
      mark: { 
        type: "bar", 
        cornerRadiusEnd: 4,
        tooltip: true,
        fillOpacity: 0.85
      },
      encoding: {
        y: {
          field: "revenue",
          type: "quantitative",
          title: "Revenue ($)",
          axis: { 
            titleColor: purpleColors.primary[1],
            labelFontSize: 11,
            grid: true,
            titleFontSize: 13,
            titleFontWeight: "normal",
            titlePadding: 10
          }
        },
        color: {
          value: purpleColors.primary[1]
        },
        tooltip: [
          { field: "month", type: "nominal", title: "Month" },
          { field: "revenue", type: "quantitative", title: "Revenue ($)", format: ",.0f" }
        ]
      }
    },
    {
      // Line chart for profit on dual axis
      mark: { 
        type: "line", 
        color: purpleColors.secondary[0], 
        strokeWidth: 3,
        point: {
          filled: true,
          fill: purpleColors.secondary[0],
          size: 80
        },
        tooltip: true
      },
      encoding: {
        y: {
          field: "profit",
          type: "quantitative",
          title: "Profit ($)",
          axis: { 
            titleColor: purpleColors.secondary[0],
            grid: false,
            offset: 40, // Offset this axis to separate from others
            labelFontSize: 11,
            titleFontSize: 13,
            titleFontWeight: "normal",
            titlePadding: 10
          },
          scale: { domain: [0, 25000] }
        },
        tooltip: [
          { field: "month", type: "nominal", title: "Month" },
          { field: "profit", type: "quantitative", title: "Profit ($)", format: ",.0f" }
        ]
      }
    },
    {
      // Scatter plot for customers
      mark: { 
        type: "point",
        color: purpleColors.secondary[2], 
        filled: true, 
        size: 80, // Slightly reduced size
        opacity: 0.7,
        tooltip: true
      },
      encoding: {
        y: {
          field: "customers",
          type: "quantitative",
          title: "Customers",
          axis: { 
            titleColor: purpleColors.secondary[2],
            grid: false,
            offset: 80, // More offset to separate from other axes
            labelFontSize: 11,
            titleFontSize: 13,
            titleFontWeight: "normal",
            titlePadding: 10
          },
          scale: { domain: [0, 350] }
        },
        tooltip: [
          { field: "month", type: "nominal", title: "Month" },
          { field: "customers", type: "quantitative", title: "Customer Count" }
        ]
      }
    }
  ],
  resolve: {
    scale: { y: "independent" }
  }
};

// 2. Enhanced stacked bar chart
export const enhancedStackedBarSpec = {
  title: "Product Category Sales",
  width: "container", // Responsive width
  height: 400,
  data: { values: productData },
  config: baseConfig,
  mark: { 
    type: "bar",
    cornerRadius: 4, // Rounded corners
    tooltip: true
  },
  encoding: {
    x: { 
      field: "category", 
      type: "nominal", 
      title: "Product Category",
      axis: { 
        labelAngle: 0,
        tickSize: 0,
        domainWidth: 0
      }
    },
    y: {
      field: "sales",
      type: "quantitative",
      title: "Sales Volume",
      axis: {
        grid: true,
        gridDash: [2, 2],
        gridOpacity: 0.3
      }
    },
    color: {
      field: "product",
      type: "nominal",
      title: "Product",
      scale: { range: [purpleColors.primary[0], purpleColors.primary[1], purpleColors.primary[2], 
                       purpleColors.secondary[0], purpleColors.secondary[1], purpleColors.secondary[2],
                       purpleColors.accent[0], purpleColors.accent[1], purpleColors.accent[2]] }
    },
    tooltip: [
      { field: "category", type: "nominal", title: "Category" },
      { field: "product", type: "nominal", title: "Product" },
      { field: "sales", type: "quantitative", title: "Sales Volume" },
      { field: "profit", type: "quantitative", title: "Profit" }
    ]
  }
};

// 3. Area Chart with Gradient
export const areaChartSpec = {
  title: "Revenue Trend",
  width: "container", // Responsive width
  height: 350,
  data: { values: timeSeriesData },
  config: baseConfig,
  mark: {
    type: "area",
    line: true,
    point: true,
    interpolate: "monotone", // Smooth curve
    tooltip: true,
    fillOpacity: 0.3,
    color: {
      gradient: "linear",
      stops: [
        { offset: 0, color: purpleColors.secondary[1] },
        { offset: 1, color: purpleColors.secondary[0] }
      ]
    }
  },
  encoding: {
    x: {
      field: "month",
      type: "nominal",
      title: "Month",
      sort: null,
      axis: {
        labelAngle: 0,
        tickSize: 0,
        domainWidth: 0
      }
    },
    y: {
      field: "revenue",
      type: "quantitative",
      title: "Revenue ($)",
      axis: {
        grid: true,
        gridDash: [2, 2],
        gridOpacity: 0.3
      }
    },
    color: {
      value: purpleColors.secondary[1]
    },
    tooltip: [
      { field: "month", type: "nominal", title: "Month" },
      { field: "revenue", type: "quantitative", title: "Revenue ($)", format: ",.0f" }
    ]
  }
};

// 4. Pie Chart
export const pieChartSpec = {
  title: "Sales Distribution by Category",
  width: 400,
  height: 400,
  data: { values: pieData },
  config: baseConfig,
  mark: { 
    type: "arc", 
    innerRadius: 80, // Creates a donut chart
    outerRadius: 150,
    padAngle: 0.02, // Space between segments
    tooltip: true
  },
  encoding: {
    theta: { 
      field: "value", 
      type: "quantitative" 
    },
    color: {
      field: "category",
      type: "nominal",
      scale: { 
        range: [
          purpleColors.primary[0],
          purpleColors.primary[2],
          purpleColors.secondary[0],
          purpleColors.secondary[2],
          purpleColors.accent[0]
        ]
      },
      legend: {
        title: "Category",
        orient: "bottom",
        direction: "horizontal",
        columns: 3
      }
    },
    tooltip: [
      { field: "category", type: "nominal", title: "Category" },
      { field: "value", type: "quantitative", title: "Sales Value" }
    ]
  }
};

// 5. Grouped bar chart
export const groupedBarSpec = {
  title: "Sales and Profit by Product",
  width: "container", // Responsive width
  height: 400,
  data: { values: productData },
  config: baseConfig,
  transform: [
    { fold: ["sales", "profit"], as: ["metric", "value"] }
  ],
  mark: { 
    type: "bar", 
    cornerRadius: 4,
    tooltip: true
  },
  encoding: {
    x: {
      field: "product",
      type: "nominal",
      title: "Product",
      axis: {
        labelAngle: -45,
        labelAlign: "right",
        tickSize: 0
      }
    },
    y: {
      field: "value",
      type: "quantitative",
      title: "Value",
      axis: {
        grid: true,
        gridDash: [2, 2],
        gridOpacity: 0.3
      }
    },
    color: {
      field: "metric",
      type: "nominal",
      title: "Metric",
      scale: {
        domain: ["sales", "profit"],
        range: [purpleColors.primary[1], purpleColors.secondary[0]]
      }
    },
    tooltip: [
      { field: "product", type: "nominal", title: "Product" },
      { field: "metric", type: "nominal", title: "Metric" },
      { field: "value", type: "quantitative", title: "Value" }
    ]
  }
};

// 6. Heatmap Chart for Marketing Data Analysis
export const heatmapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Revenue, Expense, and Net Income Comparison (2024 vs 2025)",

  "data": {
    "values": [
      { "year": "2025", "month": "Jan", "category": "revenue", "value": 1000 },
      { "year": "2025", "month": "Feb", "category": "revenue", "value": 100 },
      { "year": "2025", "month": "Mar", "category": "revenue", "value": 1623 },
      { "year": "2025", "month": "Apr", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "May", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Jun", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Jul", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Aug", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Sep", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Oct", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Nov", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Dec", "category": "revenue", "value": 0 },
      { "year": "2025", "month": "Jan", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Feb", "category": "expense", "value": 6.5 },
      { "year": "2025", "month": "Mar", "category": "expense", "value": -197995.01 },
      { "year": "2025", "month": "Apr", "category": "expense", "value": 0 },
      { "year": "2025", "month": "May", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Jun", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Jul", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Aug", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Sep", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Oct", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Nov", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Dec", "category": "expense", "value": 0 },
      { "year": "2025", "month": "Jan", "category": "net_income", "value": 1000 },
      { "year": "2025", "month": "Feb", "category": "net_income", "value": 93.5 },
      { "year": "2025", "month": "Mar", "category": "net_income", "value": 199493.01 },
      { "year": "2025", "month": "Apr", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "May", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Jun", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Jul", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Aug", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Sep", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Oct", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Nov", "category": "net_income", "value": 0 },
      { "year": "2025", "month": "Dec", "category": "net_income", "value": 0 },

      { "year": "2024", "month": "Jan", "category": "revenue", "value": 0 },
      { "year": "2024", "month": "Feb", "category": "revenue", "value": 391.25 },
      { "year": "2024", "month": "Mar", "category": "revenue", "value": 521 },
      { "year": "2024", "month": "Apr", "category": "revenue", "value": 867 },
      { "year": "2024", "month": "May", "category": "revenue", "value": 6852.27 },
      { "year": "2024", "month": "Jun", "category": "revenue", "value": 779 },
      { "year": "2024", "month": "Jul", "category": "revenue", "value": 1441 },
      { "year": "2024", "month": "Aug", "category": "revenue", "value": 0 },
      { "year": "2024", "month": "Sep", "category": "revenue", "value": 101 },
      { "year": "2024", "month": "Oct", "category": "revenue", "value": 0 },
      { "year": "2024", "month": "Nov", "category": "revenue", "value": 1532 },
      { "year": "2024", "month": "Dec", "category": "revenue", "value": 1100 },
      { "year": "2024", "month": "Jan", "category": "expense", "value": 300 },
      { "year": "2024", "month": "Feb", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Mar", "category": "expense", "value": 408.08 },
      { "year": "2024", "month": "Apr", "category": "expense", "value": 511.68 },
      { "year": "2024", "month": "May", "category": "expense", "value": 3158.69 },
      { "year": "2024", "month": "Jun", "category": "expense", "value": 2308.85 },
      { "year": "2024", "month": "Jul", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Aug", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Sep", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Oct", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Nov", "category": "expense", "value": 274 },
      { "year": "2024", "month": "Dec", "category": "expense", "value": 0 },
      { "year": "2024", "month": "Jan", "category": "net_income", "value": -300 },
      { "year": "2024", "month": "Feb", "category": "net_income", "value": 391.25 },
      { "year": "2024", "month": "Mar", "category": "net_income", "value": 112.92 },
      { "year": "2024", "month": "Apr", "category": "net_income", "value": 355.32 },
      { "year": "2024", "month": "May", "category": "net_income", "value": 3288.58 },
      { "year": "2024", "month": "Jun", "category": "net_income", "value": -1529.85 },
      { "year": "2024", "month": "Jul", "category": "net_income", "value": 1441 },
      { "year": "2024", "month": "Aug", "category": "net_income", "value": 0 },
      { "year": "2024", "month": "Sep", "category": "net_income", "value": 101 },
      { "year": "2024", "month": "Oct", "category": "net_income", "value": 0 },
      { "year": "2024", "month": "Nov", "category": "net_income", "value": 1257.25 },
      { "year": "2024", "month": "Dec", "category": "net_income", "value": 1100 }
    ]
  },

  "facet": {
    "row": {
      "field": "year",
      "type": "nominal",
      "header": { "title": "Year" }
    }
  },

  "spec": {
    "width": 800,
    "height": 200,

    "mark": {
      "type": "line",
      "interpolate": "monotone",
      "point": { "filled": false, "strokeWidth": 2 }
    },

    "encoding": {
      "x": {
        "field": "month",
        "type": "ordinal",
        "sort": [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        "axis": { "title": "Month", "gridDash": [2, 2] }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "axis": { "title": "Amount ($)", "format": "$.2f", "gridDash": [2, 2] }
      },
      "color": {
        "field": "category",
        "type": "nominal",
        "scale": { "scheme": "category10" },
        "legend": { "title": "Category" }
      },
      "tooltip": [
        { "field": "year", "type": "nominal", "title": "Year" },
        { "field": "month", "type": "ordinal", "title": "Month" },
        { "field": "category", "type": "nominal", "title": "Category" },
        { "field": "value", "type": "quantitative", "title": "Amount", "format": "$.2f" }
      ]
    }
  },

  "config": {
    "axis": { "labelFontSize": 12, "titleFontSize": 14 },
    "legend": { "labelFontSize": 12, "titleFontSize": 14 },
    "title": { "fontSize": 16 }
  }
}

const d = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"year": "2025", "month": "Jan", "category": "revenue", "value": 1000, "x_index": 0, "y_index": 0},
      {"year": "2025", "month": "Feb", "category": "revenue", "value": 100, "x_index": 1, "y_index": 0},
      {"year": "2025", "month": "Mar", "category": "revenue", "value": 1623, "x_index": 2, "y_index": 0},
      {"year": "2025", "month": "Apr", "category": "revenue", "value": 0, "x_index": 3, "y_index": 0},
      {"year": "2025", "month": "May", "category": "revenue", "value": 0, "x_index": 4, "y_index": 0},
      {"year": "2025", "month": "Jun", "category": "revenue", "value": 0, "x_index": 5, "y_index": 0},
      {"year": "2025", "month": "Jul", "category": "revenue", "value": 0, "x_index": 6, "y_index": 0},
      {"year": "2025", "month": "Aug", "category": "revenue", "value": 0, "x_index": 7, "y_index": 0},
      {"year": "2025", "month": "Sep", "category": "revenue", "value": 0, "x_index": 8, "y_index": 0},
      {"year": "2025", "month": "Oct", "category": "revenue", "value": 0, "x_index": 9, "y_index": 0},
      {"year": "2025", "month": "Nov", "category": "revenue", "value": 0, "x_index": 10, "y_index": 0},
      {"year": "2025", "month": "Dec", "category": "revenue", "value": 0, "x_index": 11, "y_index": 0},
      {"year": "2025", "month": "Jan", "category": "expense", "value": 0, "x_index": 0, "y_index": 1},
      {"year": "2025", "month": "Feb", "category": "expense", "value": 6.5, "x_index": 1, "y_index": 1},
      {"year": "2025", "month": "Mar", "category": "expense", "value": 78, "x_index": 2, "y_index": 1},
      {"year": "2025", "month": "Apr", "category": "expense", "value": 0, "x_index": 3, "y_index": 1},
      {"year": "2025", "month": "May", "category": "expense", "value": 0, "x_index": 4, "y_index": 1},
      {"year": "2025", "month": "Jun", "category": "expense", "value": 0, "x_index": 5, "y_index": 1},
      {"year": "2025", "month": "Jul", "category": "expense", "value": 0, "x_index": 6, "y_index": 1},
      {"year": "2025", "month": "Aug", "category": "expense", "value": 0, "x_index": 7, "y_index": 1},
      {"year": "2025", "month": "Sep", "category": "expense", "value": 0, "x_index": 8, "y_index": 1},
      {"year": "2025", "month": "Oct", "category": "expense", "value": 0, "x_index": 9, "y_index": 1},
      {"year": "2025", "month": "Nov", "category": "expense", "value": 0, "x_index": 10, "y_index": 1},
      {"year": "2025", "month": "Dec", "category": "expense", "value": 0, "x_index": 11, "y_index": 1},
      {"year": "2025", "month": "Jan", "category": "net_income", "value": 1000, "x_index": 0, "y_index": 2},
      {"year": "2025", "month": "Feb", "category": "net_income", "value": 93.5, "x_index": 1, "y_index": 2},
      {"year": "2025", "month": "Mar", "category": "net_income", "value": 78, "x_index": 2, "y_index": 2},
      {"year": "2025", "month": "Apr", "category": "net_income", "value": 0, "x_index": 3, "y_index": 2},
      {"year": "2025", "month": "May", "category": "net_income", "value": 0, "x_index": 4, "y_index": 2},
      {"year": "2025", "month": "Jun", "category": "net_income", "value": 0, "x_index": 5, "y_index": 2},
      {"year": "2025", "month": "Jul", "category": "net_income", "value": 0, "x_index": 6, "y_index": 2},
      {"year": "2025", "month": "Aug", "category": "net_income", "value": 0, "x_index": 7, "y_index": 2},
      {"year": "2025", "month": "Sep", "category": "net_income", "value": 0, "x_index": 8, "y_index": 2},
      {"year": "2025", "month": "Oct", "category": "net_income", "value": 0, "x_index": 9, "y_index": 2},
      {"year": "2025", "month": "Nov", "category": "net_income", "value": 0, "x_index": 10, "y_index": 2},
      {"year": "2025", "month": "Dec", "category": "net_income", "value": 0, "x_index": 11, "y_index": 2},
      {"year": "2024", "month": "Jan", "category": "revenue", "value": 0, "x_index": 0, "y_index": 0},
      {"year": "2024", "month": "Feb", "category": "revenue", "value": 391.25, "x_index": 1, "y_index": 0},
      {"year": "2024", "month": "Mar", "category": "revenue", "value": 521, "x_index": 2, "y_index": 0},
      {"year": "2024", "month": "Apr", "category": "revenue", "value": 867, "x_index": 3, "y_index": 0},
      {"year": "2024", "month": "May", "category": "revenue", "value": 6852.27, "x_index": 4, "y_index": 0},
      {"year": "2024", "month": "Jun", "category": "revenue", "value": 779, "x_index": 5, "y_index": 0},
      {"year": "2024", "month": "Jul", "category": "revenue", "value": 1441, "x_index": 6, "y_index": 0},
      {"year": "2024", "month": "Aug", "category": "revenue", "value": 0, "x_index": 7, "y_index": 0},
      {"year": "2024", "month": "Sep", "category": "revenue", "value": 101, "x_index": 8, "y_index": 0},
      {"year": "2024", "month": "Oct", "category": "revenue", "value": 0, "x_index": 9, "y_index": 0},
      {"year": "2024", "month": "Nov", "category": "revenue", "value": 1532, "x_index": 10, "y_index": 0},
      {"year": "2024", "month": "Dec", "category": "revenue", "value": 1100, "x_index": 11, "y_index": 0},
      {"year": "2024", "month": "Jan", "category": "expense", "value": 300, "x_index": 0, "y_index": 1},
      {"year": "2024", "month": "Feb", "category": "expense", "value": 0, "x_index": 1, "y_index": 1},
      {"year": "2024", "month": "Mar", "category": "expense", "value": 408.08, "x_index": 2, "y_index": 1},
      {"year": "2024", "month": "Apr", "category": "expense", "value": 511.68, "x_index": 3, "y_index": 1},
      {"year": "2024", "month": "May", "category": "expense", "value": 3158.69, "x_index": 4, "y_index": 1},
      {"year": "2024", "month": "Jun", "category": "expense", "value": 2308.85, "x_index": 5, "y_index": 1},
      {"year": "2024", "month": "Jul", "category": "expense", "value": 0, "x_index": 6, "y_index": 1},
      {"year": "2024", "month": "Aug", "category": "expense", "value": 0, "x_index": 7, "y_index": 1},
      {"year": "2024", "month": "Sep", "category": "expense", "value": 0, "x_index": 8, "y_index": 1},
      {"year": "2024", "month": "Oct", "category": "expense", "value": 0, "x_index": 9, "y_index": 1},
      {"year": "2024", "month": "Nov", "category": "expense", "value": 274, "x_index": 10, "y_index": 1},
      {"year": "2024", "month": "Dec", "category": "expense", "value": 0, "x_index": 11, "y_index": 1},
      {"year": "2024", "month": "Jan", "category": "net_income", "value": -300, "x_index": 0, "y_index": 2},
      {"year": "2024", "month": "Feb", "category": "net_income", "value": 391.25, "x_index": 1, "y_index": 2},
      {"year": "2024", "month": "Mar", "category": "net_income", "value": 112.92, "x_index": 2, "y_index": 2},
      {"year": "2024", "month": "Apr", "category": "net_income", "value": 355.32, "x_index": 3, "y_index": 2},
      {"year": "2024", "month": "May", "category": "net_income", "value": 3288.58, "x_index": 4, "y_index": 2},
      {"year": "2024", "month": "Jun", "category": "net_income", "value": -1529.85, "x_index": 5, "y_index": 2},
      {"year": "2024", "month": "Jul", "category": "net_income", "value": 1441, "x_index": 6, "y_index": 2},
      {"year": "2024", "month": "Aug", "category": "net_income", "value": 0, "x_index": 7, "y_index": 2},
      {"year": "2024", "month": "Sep", "category": "net_income", "value": 101, "x_index": 8, "y_index": 2},
      {"year": "2024", "month": "Oct", "category": "net_income", "value": 0, "x_index": 9, "y_index": 2},
      {"year": "2024", "month": "Nov", "category": "net_income", "value": 1257.25, "x_index": 10, "y_index": 2},
      {"year": "2024", "month": "Dec", "category": "net_income", "value": 1100, "x_index": 11, "y_index": 2}
    ]
  },
  "title": "Revenue, Expense, and Net Income Comparison (2024 vs 2025)",
  "facet": {
    "row": {
      "field": "year", 
      "type": "nominal",
      "title": "Year",
      "sort": ["2024", "2025"]
    }
  },
  "spec": {
    "width": 800,
    "height": 180,
    "mark": {
      "type": "line",
      "point": {
        "filled": false,
        "strokeWidth": 2
      },
      "interpolate": "monotone"
    },
    "encoding": {
      "x": {
        "field": "month",
        "type": "ordinal",
        "sort": {
          "field": "x_index",
          "order": "ascending"
        },
        "axis": {
          "title": "Month",
          "gridDash": [2, 2]
        }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "axis": {
          "title": "Amount ($)",
          "format": "$.2f",
          "gridDash": [2, 2]
        }
      },
      "color": {
        "field": "category",
        "type": "nominal",
        "scale": {
          "scheme": "category10"
        },
        "legend": {
          "title": "Category"
        }
      },
      "tooltip": [
        {
          "field": "month",
          "type": "ordinal",
          "title": "Month"
        },
        {
          "field": "value",
          "type": "quantitative",
          "title": "Amount",
          "format": "$.2f"
        },
        {
          "field": "category",
          "type": "nominal",
          "title": "Category"
        }
      ]
    }
  },
  "config": {
    "axis": {
      "labelFontSize": 12,
      "titleFontSize": 14
    },
    "legend": {
      "labelFontSize": 12,
      "titleFontSize": 14
    },
    "title": {
      "fontSize": 16
    }
  }
}

// Collection of all chart specs
export const enhancedChartSpecs = [
  enhancedDualAxisSpec,
  enhancedStackedBarSpec,
  areaChartSpec,
  pieChartSpec,
  groupedBarSpec,
  heatmapSpec,
  d
];