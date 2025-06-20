export const data = {
  "uid": "ABC123",
  "title": "Profit & Loss Dashboard",
  "view_only": true,
  "links": [],
  "tabs": [
    {
      "id": "overview",
      "title": "Overview",
      "filter": { "date_range": ["2025-01-01", "2025-06-30"] },
      "last_refreshed_at": "2025-06-17T12:00:00Z",
      "widgets": [
        {
          "id": "metric_total_revenue",
          "component_id": "comp_metric_value_1",
          "title": "Total Revenue",
          "type": "metric",
          "filter": {},
          "data": { "value": 2600000, "change": 5, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 0, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "metric_gross_profit",
          "component_id": "comp_metric_value_2",
          "title": "Total Gross Profit",
          "type": "metric",
          "filter": {},
          "data": { "value": 2000000, "change": 3, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 1, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "metric_roa",
          "component_id": "comp_metric_value_3",
          "title": "Return on Assets",
          "type": "metric",
          "filter": {},
          "data": { "value": 29, "change": 2, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 2, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "metric_operating_profit",
          "component_id": "comp_metric_value_4",
          "title": "Total Operating Profit",
          "type": "metric",
          "filter": {},
          "data": { "value": 531900, "change": -2, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 3, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "metric_roe",
          "component_id": "comp_metric_value_5",
          "title": "Return on Equity",
          "type": "metric",
          "filter": {},
          "data": { "value": 211, "change": 10, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 4, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "metric_net_profit",
          "component_id": "comp_metric_value_6",
          "title": "Total Net Profit",
          "type": "metric",
          "filter": {},
          "data": { "value": 488400, "change": 1, "changeLabel": "vs last period" },
          "position": { "x": 0, "y": 5, "w": 3, "h": 1, "minW": 2, "minH": 1 }
        },
        {
          "id": "graph_revenue_trend",
          "component_id": "comp_line_chart_1",
          "title": "Revenue Trend",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"data\":[120,132,101,134,90,230],\"type\":\"line\"}]}",
          "position": { "x": 3, "y": 0, "w": 9, "h": 3, "minW": 6, "minH": 2 }
        },
        {
          "id": "graph_expense_breakdown",
          "component_id": "comp_pie_chart_1",
          "title": "Expense Breakdown",
          "type": "graph",
          "filter": {},
          "data": "{\"series\":[{\"type\":\"pie\",\"data\":[{\"value\":335,\"name\":\"Rent\"},{\"value\":310,\"name\":\"Salaries\"},{\"value\":234,\"name\":\"Utilities\"},{\"value\":135,\"name\":\"Marketing\"}]}]}",
          "position": { "x": 3, "y": 3, "w": 3, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_profit_region",
          "component_id": "comp_bar_chart_1",
          "title": "Profit by Region",
          "type": "graph",
          "filter": {},
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"North\",\"South\",\"East\",\"West\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"data\":[120,200,150,80],\"type\":\"bar\"}]}",
          "position": { "x": 6, "y": 3, "w": 3, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_sales_category",
          "component_id": "comp_stacked_bar_1",
          "title": "Sales by Product Category",
          "type": "graph",
          "filter": {},
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Q1\",\"Q2\",\"Q3\",\"Q4\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"name\":\"Product A\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[50,60,70,80]},{\"name\":\"Product B\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[30,40,50,60]},{\"name\":\"Product C\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[20,30,40,50]}]}",
          "position": { "x": 9, "y": 3, "w": 3, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_cac_trend",
          "component_id": "comp_line_chart_2",
          "title": "Customer Acquisition Cost Trend",
          "type": "graph",
          "filter": { "granularity": "quarterly" },
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Q1\",\"Q2\",\"Q3\",\"Q4\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"data\":[150,140,130,120],\"type\":\"line\",\"markPoint\":{\"data\":[{\"type\":\"max\"},{\"type\":\"min\"}]}}]}",
          "position": { "x": 3, "y": 5, "w": 4, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_headcount_dept",
          "component_id": "comp_bar_chart_2",
          "title": "Employee Headcount by Department",
          "type": "graph",
          "filter": {},
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Sales\",\"Marketing\",\"Engineering\",\"Support\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"data\":[50,30,80,40],\"type\":\"bar\"}]}",
          "position": { "x": 7, "y": 5, "w": 5, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_cashflow_forecast",
          "component_id": "comp_area_chart_1",
          "title": "Cash Flow Forecast",
          "type": "graph",
          "filter": { "period": "next_6_months" },
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul\",\"Aug\",\"Sep\",\"Oct\",\"Nov\",\"Dec\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"data\":[100,120,150,130,160,180],\"type\":\"line\",\"areaStyle\":{}}]}",
          "position": { "x": 3, "y": 7, "w": 9, "h": 3, "minW": 6, "minH": 2 }
        },
        {
          "id": "graph_budget_actual",
          "component_id": "comp_combo_chart_1",
          "title": "Budget vs Actual",
          "type": "graph",
          "filter": {},
          "data": "{\"xAxis\":{\"type\":\"category\",\"data\":[\"Jan\",\"Feb\",\"Mar\"]},\"yAxis\":[{\"type\":\"value\"},{\"type\":\"value\"}],\"series\":[{\"name\":\"Budget\",\"type\":\"bar\",\"data\":[100,120,110]},{\"name\":\"Actual\",\"type\":\"bar\",\"data\":[90,130,100]},{\"name\":\"Variance\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[-10,10,-10]}]}",
          "position": { "x": 3, "y": 10, "w": 6, "h": 2, "minW": 4, "minH": 2 }
        },
        {
          "id": "graph_market_share",
          "component_id": "comp_pie_chart_2",
          "title": "Market Share",
          "type": "graph",
          "filter": {},
          "data": "{\"series\":[{\"type\":\"pie\",\"data\":[{\"value\":40,\"name\":\"Company A\"},{\"value\":30,\"name\":\"Company B\"},{\"value\":20,\"name\":\"Company C\"},{\"value\":10,\"name\":\"Others\"}]}]}",
          "position": { "x": 9, "y": 10, "w": 3, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "graph_roi_campaign",
          "component_id": "comp_scatter_plot_1",
          "title": "ROI by Campaign",
          "type": "graph",
          "filter": {},
          "data": "{\"xAxis\":{\"type\":\"value\"},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"type\":\"scatter\",\"data\":[[10,20],[15,25],[20,30],[25,35]]}]}",
          "position": { "x": 3, "y": 12, "w": 3, "h": 2, "minW": 3, "minH": 2 }
        },
        {
          "id": "table_pl_statement",
          "component_id": "comp_table_1",
          "title": "Detailed P&L Statement",
          "type": "table",
          "filter": { "category": ["All"] },
          "data": "<table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody><tr><td>Revenue</td><td>$2,600,000</td></tr><tr><td>Cost of Goods Sold</td><td>$600,000</td></tr><tr><td>Gross Profit</td><td>$2,000,000</td></tr><tr><td>Operating Expenses</td><td>$1,468,100</td></tr><tr><td>Operating Profit</td><td>$531,900</td></tr><tr><td>Taxes</td><td>$43,500</td></tr><tr><td>Net Profit</td><td>$488,400</td></tr></tbody></table>",
          "position": { "x": 3, "y": 14, "w": 9, "h": 4, "minW": 4, "minH": 2 }
        },
        {
          "id": "table_top_customers",
          "component_id": "comp_table_2",
          "title": "Top Customers by Revenue",
          "type": "table",
          "filter": {},
          "data": "<table><thead><tr><th>Customer</th><th>Revenue</th></tr></thead><tbody><tr><td>Customer A</td><td>$500,000</td></tr><tr><td>Customer B</td><td>$400,000</td></tr><tr><td>Customer C</td><td>$300,000</td></tr><tr><td>Customer D</td><td>$200,000</td></tr><tr><td>Customer E</td><td>$100,000</td></tr></tbody></table>",
          "position": { "x": 3, "y": 18, "w": 9, "h": 4, "minW": 4, "minH": 2 }
        }
      ]
    },
    {
      "id": "finance",
      "title": "Finance",
      "filter": { "date_range": ["2025-01-01", "2025-06-30"] },
      "last_refreshed_at": "2025-06-17T12:05:00Z",
      "widgets": [
        {
          "id": "graph_revenue_trend",
          "component_id": "comp_line_chart_1",
          "title": "Revenue Trend",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jan\",\"Feb\",\"Mar\",\"Apr\",\"May\",\"Jun\"]},\"yAxis\":{\"type\":\"value\"},\"series\":[{\"name\":\"Revenue\",\"type\":\"bar\",\"data\":[150,230,224,218,135,147],\"itemStyle\":{\"color\":\"#4FD1C5\"}}],\"grid\":{\"top\":\"15%\",\"bottom\":\"15%\",\"left\":\"10%\",\"right\":\"5%\"}}",
          "position": { "x": 0, "y": 0, "w": 8, "h": 4, "minW": 6, "minH": 3 }
        }
      ]
    }
  ]
}