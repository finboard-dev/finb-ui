export const data = {
  "uid": "XERO_DASH_001",
  "title": "Xero Financial Dashboard",
  "view_only": false,
  "links": [
    { "title": "LOG IN", "url": "/login", "type": "primary" },
    { "title": "TALK TO EXPERT", "url": "/expert", "type": "secondary" }
  ],
  "tabs": [
    {
      "id": "profit_loss",
      "title": "Profit and Loss",
      "filter": { "date_range": ["2024-01-01", "2024-12-31"] },
      "last_refreshed_at": "2024-12-21T14:30:00Z",
      "widgets": [
        // Key Metrics Row 1
        {
          "id": "metric_total_revenue",
          "component_id": "comp_metric_value_1",
          "title": "Total Revenue",
          "type": "metric",
          "filter": {},
          "data": { "value": 2600000, "change": 8.5, "changeLabel": "vs last period", "format": "currency" },
          "position": { "x": 0, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_gross_profit",
          "component_id": "comp_metric_value_2",
          "title": "Total Gross Profit",
          "type": "metric",
          "filter": {},
          "data": { "value": 2000000, "change": 6.2, "changeLabel": "vs last period", "format": "currency" },
          "position": { "x": 8, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        
        // Key Metrics Row 2
        {
          "id": "metric_roa",
          "component_id": "comp_metric_value_3",
          "title": "Return on Assets",
          "type": "metric",
          "filter": {},
          "data": { "value": 29, "change": 3.1, "changeLabel": "vs last period", "format": "percentage" },
          "position": { "x": 0, "y": 4, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_operating_profit",
          "component_id": "comp_metric_value_4",
          "title": "Total Operating Profit (Loss)",
          "type": "metric",
          "filter": {},
          "data": { "value": 531900, "change": -2.3, "changeLabel": "vs last period", "format": "currency" },
          "position": { "x": 8, "y": 4, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        
        // Key Metrics Row 3
        {
          "id": "metric_roe",
          "component_id": "comp_metric_value_5",
          "title": "Return on Equity",
          "type": "metric",
          "filter": {},
          "data": { "value": 211, "change": 12.4, "changeLabel": "vs last period", "format": "percentage" },
          "position": { "x": 0, "y": 8, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_net_profit",
          "component_id": "comp_metric_value_6",
          "title": "Total Net Profit (Loss)",
          "type": "metric",
          "filter": {},
          "data": { "value": 488400, "change": 4.7, "changeLabel": "vs last period", "format": "currency" },
          "position": { "x": 8, "y": 8, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },

        // Main Revenue and Expenses Chart
        {
          "id": "graph_operating_income_expenses",
          "component_id": "comp_combo_chart_1",
          "title": "Operating Income and Expenses past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Revenue\",\"Expenses\",\"Operating Margin\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":[{\"type\":\"value\",\"name\":\"Amount\",\"axisLabel\":{\"formatter\":\"{value}K\"}},{\"type\":\"value\",\"name\":\"Margin %\",\"axisLabel\":{\"formatter\":\"{value}%\"}}],\"series\":[{\"name\":\"Revenue\",\"type\":\"bar\",\"data\":[420,450,380,460,520,580,490,510,530,480,560,590],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Expenses\",\"type\":\"bar\",\"data\":[320,340,290,350,390,420,370,380,400,360,420,440],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Operating Margin\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[24,24,24,24,25,28,24,25,25,25,25,25],\"itemStyle\":{\"color\":\"#2ca02c\"}}]}",
          "position": { "x": 16, "y": 0, "w": 32, "h": 12, "minW": 24, "minH": 12 }
        },

        // Gross Profit Chart
        {
          "id": "graph_gross_profit",
          "component_id": "comp_line_chart_1",
          "title": "Gross Profit past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Gross Profit\",\"Gross Margin\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{\"type\":\"value\",\"name\":\"Amount\",\"axisLabel\":{\"formatter\":\"{value}K\"}},{\"type\":\"value\",\"name\":\"Margin %\",\"axisLabel\":{\"formatter\":\"{value}%\"}}],\"series\":[{\"name\":\"Gross Profit\",\"type\":\"line\",\"data\":[320,340,360,380],\"itemStyle\":{\"color\":\"#1f77b4\"},\"smooth\":true},{\"name\":\"Gross Margin\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[76,76,75,74],\"itemStyle\":{\"color\":\"#ff7f0e\"},\"smooth\":true}]}",
          "position": { "x": 0, "y": 12, "w": 24, "h": 8, "minW": 16, "minH": 8 }
        },

        // Expense Breakdown Pie Charts
        {
          "id": "graph_expense_breakdown_current",
          "component_id": "comp_pie_chart_1",
          "title": "Expenses by Account name as of today",
          "type": "graph",
          "filter": {},
          "data": "{\"tooltip\":{\"trigger\":\"item\"},\"legend\":{\"orient\":\"vertical\",\"left\":\"left\"},\"series\":[{\"type\":\"pie\",\"radius\":[\"40%\",\"70%\"],\"data\":[{\"value\":25,\"name\":\"Rent office space\",\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"value\":22,\"name\":\"Wages & Salaries\",\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"value\":18,\"name\":\"Payroll Tax Expense\",\"itemStyle\":{\"color\":\"#2ca02c\"}},{\"value\":15,\"name\":\"Bank Revaluations\",\"itemStyle\":{\"color\":\"#d62728\"}},{\"value\":12,\"name\":\"Utilities office space\",\"itemStyle\":{\"color\":\"#9467bd\"}},{\"value\":8,\"name\":\"Unrealized Currency Gains\",\"itemStyle\":{\"color\":\"#8c564b\"}}]}]}",
          "position": { "x": 24, "y": 12, "w": 12, "h": 8, "minW": 12, "minH": 8 }
        },

        {
          "id": "graph_expense_breakdown_month_end",
          "component_id": "comp_pie_chart_2",
          "title": "Expenses by Account name as of the end of last month",
          "type": "graph",
          "filter": {},
          "data": "{\"tooltip\":{\"trigger\":\"item\"},\"legend\":{\"orient\":\"vertical\",\"left\":\"left\"},\"series\":[{\"type\":\"pie\",\"radius\":[\"40%\",\"70%\"],\"data\":[{\"value\":28,\"name\":\"Wages & Salaries\",\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"value\":24,\"name\":\"Rent office space\",\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"value\":16,\"name\":\"Payroll Tax Expense\",\"itemStyle\":{\"color\":\"#2ca02c\"}},{\"value\":14,\"name\":\"Utilities office space\",\"itemStyle\":{\"color\":\"#d62728\"}},{\"value\":10,\"name\":\"Office expenses miscellaneous\",\"itemStyle\":{\"color\":\"#9467bd\"}},{\"value\":8,\"name\":\"Unrealized Currency Gains\",\"itemStyle\":{\"color\":\"#8c564b\"}}]}]}",
          "position": { "x": 36, "y": 12, "w": 12, "h": 8, "minW": 12, "minH": 8 }
        },

        // Operating Profit Chart
        {
          "id": "graph_operating_profit",
          "component_id": "comp_line_chart_2",
          "title": "Operating Profit (Loss) past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Operating Profit(Loss)\",\"Operating Margin\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{\"type\":\"value\",\"name\":\"Amount\",\"axisLabel\":{\"formatter\":\"{value}K\"}},{\"type\":\"value\",\"name\":\"Margin %\",\"axisLabel\":{\"formatter\":\"{value}%\"}}],\"series\":[{\"name\":\"Operating Profit(Loss)\",\"type\":\"line\",\"data\":[45,48,52,48],\"itemStyle\":{\"color\":\"#1f77b4\"},\"smooth\":true},{\"name\":\"Operating Margin\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[11,11,12,11],\"itemStyle\":{\"color\":\"#ff7f0e\"},\"smooth\":true}]}",
          "position": { "x": 0, "y": 20, "w": 24, "h": 8, "minW": 16, "minH": 8 }
        },

        // Net Profit Chart
        {
          "id": "graph_net_profit",
          "component_id": "comp_line_chart_3",
          "title": "Net Profit (Loss) past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Net Profit(Loss)\",\"Net Margin\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{\"type\":\"value\",\"name\":\"Amount\",\"axisLabel\":{\"formatter\":\"{value}K\"}},{\"type\":\"value\",\"name\":\"Margin %\",\"axisLabel\":{\"formatter\":\"{value}%\"}}],\"series\":[{\"name\":\"Net Profit(Loss)\",\"type\":\"line\",\"data\":[42,45,48,45],\"itemStyle\":{\"color\":\"#1f77b4\"},\"smooth\":true},{\"name\":\"Net Margin\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[10,10,11,10],\"itemStyle\":{\"color\":\"#ff7f0e\"},\"smooth\":true}]}",
          "position": { "x": 24, "y": 20, "w": 24, "h": 8, "minW": 16, "minH": 8 }
        },

        // Revenue and Expenses Bar Charts
        {
          "id": "graph_revenue_12mos",
          "component_id": "comp_stacked_bar_1",
          "title": "Revenue past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Direct Costs\",\"Gross Profit\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}K\"}},\"series\":[{\"name\":\"Direct Costs\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[100,110,95,115,130,145,120,125,135,115,140,150],\"itemStyle\":{\"color\":\"#d62728\"}},{\"name\":\"Gross Profit\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[320,340,285,345,390,435,370,385,395,365,420,440],\"itemStyle\":{\"color\":\"#1f77b4\"}}]}",
          "position": { "x": 0, "y": 28, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        {
          "id": "graph_expenses_by_type",
          "component_id": "comp_stacked_bar_2",
          "title": "Expenses by Account type",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Direct Costs\",\"Expense\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}K\"}},\"series\":[{\"name\":\"Direct Costs\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[100,110,95,115,130,145,120,125,135,115,140,150],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Expense\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[220,230,195,235,260,275,250,255,265,245,280,290],\"itemStyle\":{\"color\":\"#d62728\"}}]}",
          "position": { "x": 24, "y": 28, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // Revenue and Expenses by Account Name
        {
          "id": "graph_revenue_by_account",
          "component_id": "comp_stacked_bar_3",
          "title": "Revenue by Account name",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Sales\",\"Service\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}K\"}},\"series\":[{\"name\":\"Sales\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[250,270,230,275,310,350,295,305,315,290,335,355],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Service\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[170,180,150,185,210,230,195,205,215,190,225,235],\"itemStyle\":{\"color\":\"#2ca02c\"}}]}",
          "position": { "x": 0, "y": 40, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        {
          "id": "graph_expenses_by_account",
          "component_id": "comp_stacked_bar_4",
          "title": "Expenses by Account name",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Bank Revaluations\",\"Office expenses miscellaneous\",\"Payment Provider Fees Stripe\",\"Payroll Tax Expense\",\"Realized Currency Gains\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}K\"}},\"series\":[{\"name\":\"Bank Revaluations\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[45,48,42,50,55,60,52,54,56,50,58,62],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Office expenses miscellaneous\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[35,38,32,40,44,48,42,44,46,40,48,52],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Payment Provider Fees Stripe\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[25,28,22,30,33,36,32,34,36,30,38,42],\"itemStyle\":{\"color\":\"#2ca02c\"}},{\"name\":\"Payroll Tax Expense\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[55,58,52,60,66,72,62,64,66,60,68,74],\"itemStyle\":{\"color\":\"#d62728\"}},{\"name\":\"Realized Currency Gains\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[15,18,12,20,22,24,22,24,26,20,28,32],\"itemStyle\":{\"color\":\"#9467bd\"}}]}",
          "position": { "x": 24, "y": 40, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // P&L Statement Table
        {
          "id": "table_pl_statement",
          "component_id": "comp_table_1",
          "title": "Profit and Loss statement",
          "type": "table",
          "filter": { "category": ["All"] },
          "data": "<table><thead><tr><th>Account type</th><th>Month to date</th><th>Last month</th><th>Year to date</th></tr></thead><tbody><tr><td><strong>Revenue</strong></td><td>$86,464</td><td>$336,110</td><td>$1,301,738</td></tr><tr><td><strong>Direct Costs</strong></td><td>$0</td><td>-$60,630</td><td>-$312,630</td></tr><tr><td><strong>Gross Profit</strong></td><td>$86,464</td><td>$275,610</td><td>$989,108</td></tr><tr><td><strong>Expense</strong></td><td>-$60,795</td><td>-$175,105</td><td>-$548,218</td></tr><tr><td><strong>Operating Profit(Loss)</strong></td><td>$5,709</td><td>$110,505</td><td>$394,890</td></tr><tr><td><strong>Other Income(Expense)</strong></td><td>$0</td><td>$4,536</td><td>-$13,513</td></tr><tr><td><strong>Depreciation</strong></td><td>–</td><td>–</td><td>–</td></tr><tr><td><strong>Overheads</strong></td><td>–</td><td>–</td><td>–</td></tr><tr><td><strong>Net Profit(Loss)</strong></td><td>$5,709</td><td>$115,041</td><td>$381,377</td></tr></tbody></table>",
          "position": { "x": 0, "y": 52, "w": 48, "h": 16, "minW": 32, "minH": 12 }
        }
      ]
    },
    {
      "id": "cash_flow",
      "title": "Cash flow",
      "filter": { "date_range": ["2024-01-01", "2024-12-31"] },
      "last_refreshed_at": "2024-12-21T14:35:00Z",
      "widgets": [
        // Cash Flow Metrics
        {
          "id": "metric_cash_in_bank",
          "component_id": "comp_metric_value_7",
          "title": "Cash in Bank (current)",
          "type": "metric",
          "filter": {},
          "data": { "value": 744500, "change": 0, "changeLabel": "", "format": "currency" },
          "position": { "x": 0, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_cash_ratio",
          "component_id": "comp_metric_value_8",
          "title": "Cash Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 3.40, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 8, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_burn_rate",
          "component_id": "comp_metric_value_9",
          "title": "Burn Rate (avg 6 mos)",
          "type": "metric",
          "filter": {},
          "data": { "value": 134300, "change": 0, "changeLabel": "", "format": "currency" },
          "position": { "x": 0, "y": 4, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_quick_ratio",
          "component_id": "comp_metric_value_10",
          "title": "Quick Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 5.09, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 8, "y": 4, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_cash_runway",
          "component_id": "comp_metric_value_11",
          "title": "Cash Runaway (months)",
          "type": "metric",
          "filter": {},
          "data": { "value": 4.8, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 0, "y": 8, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_current_ratio",
          "component_id": "comp_metric_value_12",
          "title": "Current Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 5.09, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 8, "y": 8, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },

        // Cash in Bank Chart
        {
          "id": "graph_cash_in_bank_trend",
          "component_id": "comp_combo_chart_2",
          "title": "Cash in Bank past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Closing Balance\",\"Cash Ratio\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Sep 24\",\"Nov 24\",\"Jan 25\",\"Mar 25\",\"May 25\"]},\"yAxis\":[{\"type\":\"value\",\"name\":\"Amount\",\"axisLabel\":{\"formatter\":\"{value}K\"}},{\"type\":\"value\",\"name\":\"Ratio\",\"axisLabel\":{\"formatter\":\"{value}\"}}],\"series\":[{\"name\":\"Closing Balance\",\"type\":\"bar\",\"data\":[280,290,270,300,350,400,420,450,480,520,580,650],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Cash Ratio\",\"type\":\"line\",\"yAxisIndex\":1,\"data\":[2.1,2.2,2.0,2.3,2.6,3.0,3.1,3.3,3.5,3.8,4.2,4.7],\"itemStyle\":{\"color\":\"#ff7f0e\"},\"smooth\":true}]}",
          "position": { "x": 16, "y": 0, "w": 32, "h": 12, "minW": 24, "minH": 12 }
        },

        // Cash Balance by Currency
        {
          "id": "graph_cash_balance_currency",
          "component_id": "comp_stacked_bar_5",
          "title": "Cash Balance by Currency",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"EUR\",\"GBP\",\"USD\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}K\"}},\"series\":[{\"name\":\"EUR\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[120,125,115,130,140,150,145,155,165,175,190,200],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"GBP\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[80,85,75,90,95,100,105,110,115,120,130,140],\"itemStyle\":{\"color\":\"#d62728\"}},{\"name\":\"USD\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[200,210,190,220,240,260,270,285,300,325,360,380],\"itemStyle\":{\"color\":\"#ff7f0e\"}}]}",
          "position": { "x": 0, "y": 12, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // Cash Balance by Bank
        {
          "id": "graph_cash_balance_bank",
          "component_id": "comp_pie_chart_3",
          "title": "Cash Balance by Bank as of today",
          "type": "graph",
          "filter": {},
          "data": "{\"tooltip\":{\"trigger\":\"item\"},\"legend\":{\"orient\":\"vertical\",\"left\":\"left\"},\"series\":[{\"type\":\"pie\",\"radius\":[\"40%\",\"70%\"],\"data\":[{\"value\":75,\"name\":\"J.P. Morgan Chase Bank\",\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"value\":25,\"name\":\"Citibank\",\"itemStyle\":{\"color\":\"#d62728\"}}]}]}",
          "position": { "x": 24, "y": 12, "w": 24, "h": 12, "minW": 12, "minH": 8 }
        },

        // Cash Flow Statement Table
        {
          "id": "table_cash_flow_statement",
          "component_id": "comp_table_2",
          "title": "Cash flow as of the end of last month",
          "type": "table",
          "filter": {},
          "data": "<table><thead><tr><th>Bank Account</th><th>Opening Balance ↓</th><th>Cash Received</th><th>Cash Spent</th><th>Closing Balance</th><th>Net Cash</th></tr></thead><tbody><tr><td>J.P. Morgan Chase Bank</td><td>$437,584</td><td>$324,850</td><td>$213,640</td><td>$548,793</td><td>$111,210</td></tr><tr><td>Citibank</td><td>$90,519</td><td>$93,316</td><td>$93,169</td><td>$93,203</td><td>$127</td></tr><tr><td>Wells Fargo Bank</td><td>$0</td><td>$84,958</td><td>$85,411</td><td>$0</td><td>-$453</td></tr><tr><td colspan=\"6\" style=\"height: 20px;\"></td></tr><tr><td><strong>Grand total</strong></td><td><strong>$528,103</strong></td><td><strong>$503,124</strong></td><td><strong>$392,240</strong></td><td><strong>$641,996</strong></td><td><strong>$110,884</strong></td></tr></tbody></table>",
          "position": { "x": 0, "y": 24, "w": 48, "h": 16, "minW": 32, "minH": 12 }
        }
      ]
    },
    {
      "id": "balance_sheet",
      "title": "Balance Sheet",
      "filter": { "date_range": ["2024-01-01", "2024-12-31"] },
      "last_refreshed_at": "2024-12-21T14:40:00Z",
      "widgets": [
        // Balance Sheet Metrics
        {
          "id": "metric_assets_current",
          "component_id": "comp_metric_value_13",
          "title": "Assets (current)",
          "type": "metric",
          "filter": {},
          "data": { "value": 1400000, "change": 0, "changeLabel": "", "format": "currency" },
          "position": { "x": 0, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_liabilities_current",
          "component_id": "comp_metric_value_14",
          "title": "Liabilities (current)",
          "type": "metric",
          "filter": {},
          "data": { "value": 1200000, "change": 0, "changeLabel": "", "format": "currency" },
          "position": { "x": 8, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_equity_current",
          "component_id": "comp_metric_value_15",
          "title": "Equity (current)",
          "type": "metric",
          "filter": {},
          "data": { "value": 214900, "change": 0, "changeLabel": "", "format": "currency" },
          "position": { "x": 16, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_assets_equity_ratio",
          "component_id": "comp_metric_value_16",
          "title": "Assets to Equity Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 7.28, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 24, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_debt_assets_ratio",
          "component_id": "comp_metric_value_17",
          "title": "Debt to Assets Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 0.86, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 32, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },
        {
          "id": "metric_debt_equity_ratio",
          "component_id": "comp_metric_value_18",
          "title": "Debt to Equity Ratio",
          "type": "metric",
          "filter": {},
          "data": { "value": 6.28, "change": 0, "changeLabel": "", "format": "decimal" },
          "position": { "x": 40, "y": 0, "w": 8, "h": 4, "minW": 8, "minH": 4 }
        },

        // Assets Chart
        {
          "id": "graph_assets_12mos",
          "component_id": "comp_stacked_bar_6",
          "title": "Assets past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Bank\",\"Long-term Assets\",\"Other Current Assets\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}M\"}},\"series\":[{\"name\":\"Bank\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.5,0.52,0.48,0.55,0.62,0.68,0.65,0.7,0.75,0.8,0.88,0.95],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Long-term Assets\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.3,0.32,0.28,0.35,0.38,0.42,0.4,0.42,0.45,0.48,0.52,0.55],\"itemStyle\":{\"color\":\"#d62728\"}},{\"name\":\"Other Current Assets\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.2,0.22,0.18,0.25,0.28,0.32,0.3,0.32,0.35,0.38,0.42,0.45],\"itemStyle\":{\"color\":\"#ff7f0e\"}}]}",
          "position": { "x": 0, "y": 4, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // Liabilities and Equity Chart
        {
          "id": "graph_liabilities_equity_12mos",
          "component_id": "comp_stacked_bar_7",
          "title": "Liabilities and Equity past 12 mos",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Current Liabilities\",\"Equity\",\"Non-current Liabilities\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}M\"}},\"series\":[{\"name\":\"Current Liabilities\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.15,0.16,0.14,0.17,0.19,0.21,0.2,0.21,0.22,0.24,0.26,0.28],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Equity\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.65,0.68,0.62,0.73,0.79,0.86,0.82,0.87,0.93,0.98,1.06,1.14],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Non-current Liabilities\",\"type\":\"bar\",\"stack\":\"total\",\"data\":[0.2,0.22,0.18,0.25,0.28,0.32,0.3,0.32,0.35,0.38,0.42,0.45],\"itemStyle\":{\"color\":\"#2ca02c\"}}]}",
          "position": { "x": 24, "y": 4, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // Balance Sheet Comparison Charts
        {
          "id": "graph_balance_sheet_last_month",
          "component_id": "comp_stacked_bar_8",
          "title": "Balance Sheet as of the end of last month",
          "type": "graph",
          "filter": {},
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Long-term Assets\",\"Other Current Assets\",\"Bank\",\"Non-current Liabilities\",\"Equity\",\"Current Liabilities\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Assets\",\"Liabilities and Equity\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}M\"}},\"series\":[{\"name\":\"Long-term Assets\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.5,0],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Other Current Assets\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.32,0],\"itemStyle\":{\"color\":\"#2ca02c\"}},{\"name\":\"Bank\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.86,0],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Non-current Liabilities\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,1.125],\"itemStyle\":{\"color\":\"#9467bd\"}},{\"name\":\"Equity\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,0.21],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Current Liabilities\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,0.19],\"itemStyle\":{\"color\":\"#d62728\"}}]}",
          "position": { "x": 0, "y": 16, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        {
          "id": "graph_balance_sheet_today",
          "component_id": "comp_stacked_bar_9",
          "title": "Balance Sheet as of today",
          "type": "graph",
          "filter": {},
          "data": "{\"tooltip\":{\"trigger\":\"axis\"},\"legend\":{\"data\":[\"Long-term Assets\",\"Other Current Assets\",\"Bank\",\"Non-current Liabilities\",\"Equity\",\"Current Liabilities\"]},\"xAxis\":{\"type\":\"category\",\"data\":[\"Assets\",\"Liabilities and Equity\"]},\"yAxis\":{\"type\":\"value\",\"axisLabel\":{\"formatter\":\"{value}M\"}},\"series\":[{\"name\":\"Long-term Assets\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.5,0],\"itemStyle\":{\"color\":\"#1f77b4\"}},{\"name\":\"Other Current Assets\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.087,0],\"itemStyle\":{\"color\":\"#2ca02c\"}},{\"name\":\"Bank\",\"type\":\"bar\",\"stack\":\"assets\",\"data\":[0.86,0],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Non-current Liabilities\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,1.125],\"itemStyle\":{\"color\":\"#9467bd\"}},{\"name\":\"Equity\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,0.215],\"itemStyle\":{\"color\":\"#ff7f0e\"}},{\"name\":\"Current Liabilities\",\"type\":\"bar\",\"stack\":\"liabilities\",\"data\":[0,0.033],\"itemStyle\":{\"color\":\"#d62728\"}}]}",
          "position": { "x": 24, "y": 16, "w": 24, "h": 12, "minW": 16, "minH": 8 }
        },

        // Balance Sheet Statement Table
        {
          "id": "table_balance_sheet_statement",
          "component_id": "comp_table_3",
          "title": "Balance Sheet statement",
          "type": "table",
          "filter": {},
          "data": "<table><thead><tr><th>Account type</th><th>Today</th><th>Last month</th><th>Year to date</th></tr></thead><tbody><tr><td><strong>Bank</strong></td><td>$744,469</td><td>$641,996</td><td>$744,469</td></tr><tr><td><strong>Current Assets</strong></td><td>$86,735</td><td>$319,097</td><td>$86,735</td></tr><tr><td><strong>Fixed Assets</strong></td><td>$61,725</td><td>$61,725</td><td>$61,725</td></tr><tr><td><strong>Long-term Assets</strong></td><td>$500,000</td><td>$500,000</td><td>$500,000</td></tr><tr><td><strong>TOTAL ASSETS</strong></td><td><strong>$1,372,929</strong></td><td><strong>$1,522,818</strong></td><td><strong>$1,372,929</strong></td></tr><tr><td colspan=\"4\" style=\"height: 10px;\"></td></tr><tr><td><strong>Current Liabilities</strong></td><td>$33,040</td><td>$188,640</td><td>$33,040</td></tr><tr><td><strong>Non-current Liabilities</strong></td><td>$1,125,000</td><td>$1,125,000</td><td>$1,125,000</td></tr><tr><td><strong>Equity</strong></td><td>$214,888</td><td>$209,178</td><td>$214,888</td></tr><tr><td><strong>TOTAL LIABILITIES AND EQUITY</strong></td><td><strong>$1,372,928</strong></td><td><strong>$1,522,818</strong></td><td><strong>$1,372,928</strong></td></tr></tbody></table>",
          "position": { "x": 0, "y": 28, "w": 48, "h": 16, "minW": 32, "minH": 12 }
        }
      ]
    },
        {
          "id": "profitloss",
          "title": "Profit",
          "widgets": [
            {
              "id": "graph_operating_income_expenses",
              "title": "Operating Income and Expenses past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":[{},{}],\"series\":[{\"type\":\"bar\",\"data\":[420,450,380,460,520,580,490,510,530,480,560,590],\"name\":\"Revenue\"},{\"type\":\"bar\",\"data\":[320,340,290,350,390,420,370,380,400,360,420,440],\"name\":\"Expenses\"},{\"type\":\"line\",\"data\":[24,24,24,24,25,28,24,25,25,25,25,25],\"name\":\"Operating Margin\",\"yAxisIndex\":1}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 16, "y": 0, "w": 32, "h": 12, "minW": 24, "minH": 12 }
            },
            {
              "id": "graph_gross_profit",
              "title": "Gross Profit past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{},{}],\"series\":[{\"type\":\"line\",\"data\":[320,340,360,380],\"name\":\"Gross Profit\"},{\"type\":\"line\",\"data\":[76,76,75,74],\"name\":\"Gross Margin\",\"yAxisIndex\":1}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 12, "w": 24, "h": 8, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_expense_breakdown_current",
              "title": "Expenses by Account name as of today",
              "type": "graph",
              "filter": {},
              "data": "{\"series\":[{\"type\":\"pie\",\"data\":[{\"value\":25,\"name\":\"Rent office space\"},{\"value\":22,\"name\":\"Wages & Salaries\"},{\"value\":18,\"name\":\"Payroll Tax Expense\"},{\"value\":15,\"name\":\"Bank Revaluations\"},{\"value\":12,\"name\":\"Utilities office space\"},{\"value\":8,\"name\":\"Unrealized Currency Gains\"}]}],\"tooltip\":{\"trigger\":\"item\"}}",
              "position": { "x": 24, "y": 12, "w": 12, "h": 8, "minW": 12, "minH": 8 }
            },
            {
              "id": "graph_expense_breakdown_month_end",
              "title": "Expenses by Account name as of the end of last month",
              "type": "graph",
              "filter": {},
              "data": "{\"series\":[{\"type\":\"pie\",\"data\":[{\"value\":28,\"name\":\"Wages & Salaries\"},{\"value\":24,\"name\":\"Rent office space\"},{\"value\":16,\"name\":\"Payroll Tax Expense\"},{\"value\":14,\"name\":\"Utilities office space\"},{\"value\":10,\"name\":\"Office expenses miscellaneous\"},{\"value\":8,\"name\":\"Unrealized Currency Gains\"}]}],\"tooltip\":{\"trigger\":\"item\"}}",
              "position": { "x": 36, "y": 12, "w": 12, "h": 8, "minW": 12, "minH": 8 }
            },
            {
              "id": "graph_operating_profit",
              "title": "Operating Profit (Loss) past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{},{}],\"series\":[{\"type\":\"line\",\"data\":[45,48,52,48],\"name\":\"Operating Profit(Loss)\"},{\"type\":\"line\",\"data\":[11,11,12,11],\"name\":\"Operating Margin\",\"yAxisIndex\":1}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 20, "w": 24, "h": 8, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_net_profit",
              "title": "Net Profit (Loss) past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Oct 24\",\"Jan 25\",\"Apr 25\"]},\"yAxis\":[{},{}],\"series\":[{\"type\":\"line\",\"data\":[42,45,48,45],\"name\":\"Net Profit(Loss)\"},{\"type\":\"line\",\"data\":[10,10,11,10],\"name\":\"Net Margin\",\"yAxisIndex\":1}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 24, "y": 20, "w": 24, "h": 8, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_revenue_12mos",
              "title": "Revenue past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[100,110,95,115,130,145,120,125,135,115,140,150],\"name\":\"Direct Costs\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[320,340,285,345,390,435,370,385,395,365,420,440],\"name\":\"Gross Profit\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 28, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_expenses_by_type",
              "title": "Expenses by Account type",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[100,110,95,115,130,145,120,125,135,115,140,150],\"name\":\"Direct Costs\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[220,230,195,235,260,275,250,255,265,245,280,290],\"name\":\"Expense\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 24, "y": 28, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_revenue_by_account",
              "title": "Revenue by Account name",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[250,270,230,275,310,350,295,305,315,290,335,355],\"name\":\"Sales\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[170,180,150,185,210,230,195,205,215,190,225,235],\"name\":\"Service\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 40, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_expenses_by_account",
              "title": "Expenses by Account name",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[45,48,42,50,55,60,52,54,56,50,58,62],\"name\":\"Bank Revaluations\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[35,38,32,40,44,48,42,44,46,40,48,52],\"name\":\"Office expenses miscellaneous\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[25,28,22,30,33,36,32,34,36,30,38,42],\"name\":\"Payment Provider Fees Stripe\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[55,58,52,60,66,72,62,64,66,60,68,74],\"name\":\"Payroll Tax Expense\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[15,18,12,20,22,24,22,24,26,20,28,32],\"name\":\"Realized Currency Gains\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 24, "y": 40, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            }
          ]
        },
        {
          "id": "cashflow",
          "title": "Loss",
          "widgets": [
            {
              "id": "graph_cash_in_bank_trend",
              "title": "Cash in Bank past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Sep 24\",\"Nov 24\",\"Jan 25\",\"Mar 25\",\"May 25\"]},\"yAxis\":[{},{}],\"series\":[{\"type\":\"bar\",\"data\":[280,290,270,300,350,400,420,450,480,520,580,650],\"name\":\"Closing Balance\"},{\"type\":\"line\",\"data\":[2.1,2.2,2.0,2.3,2.6,3.0,3.1,3.3,3.5,3.8,4.2,4.7],\"name\":\"Cash Ratio\",\"yAxisIndex\":1}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 16, "y": 0, "w": 32, "h": 12, "minW": 24, "minH": 12 }
            },
            {
              "id": "graph_cash_balance_currency",
              "title": "Cash Balance by Currency",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[120,125,115,130,140,150,145,155,165,175,190,200],\"name\":\"EUR\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[80,85,75,90,95,100,105,110,115,120,130,140],\"name\":\"GBP\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[200,210,190,220,240,260,270,285,300,325,360,380],\"name\":\"USD\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 12, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_cash_balance_bank",
              "title": "Cash Balance by Bank as of today",
              "type": "graph",
              "filter": {},
              "data": "{\"series\":[{\"type\":\"pie\",\"data\":[{\"value\":75,\"name\":\"J.P. Morgan Chase Bank\"},{\"value\":25,\"name\":\"Citibank\"}]}],\"tooltip\":{\"trigger\":\"item\"}}",
              "position": { "x": 24, "y": 12, "w": 24, "h": 12, "minW": 12, "minH": 8 }
            }
          ]
        },
        {
          "id": "balancecheet",
          "title": "BalanceCheet",
          "widgets": [
            {
              "id": "graph_assets_12mos",
              "title": "Assets past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[0.5,0.52,0.48,0.55,0.62,0.68,0.65,0.7,0.75,0.8,0.88,0.95],\"name\":\"Bank\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[0.3,0.32,0.28,0.35,0.38,0.42,0.4,0.42,0.45,0.48,0.52,0.55],\"name\":\"Long-term Assets\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[0.2,0.22,0.18,0.25,0.28,0.32,0.3,0.32,0.35,0.38,0.42,0.45],\"name\":\"Other Current Assets\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 4, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_liabilities_equity_12mos",
              "title": "Liabilities and Equity past 12 mos",
              "type": "graph",
              "filter": { "granularity": "monthly" },
              "data": "{\"xAxis\":{\"data\":[\"Jul 24\",\"Aug 24\",\"Sep 24\",\"Oct 24\",\"Nov 24\",\"Dec 24\",\"Jan 25\",\"Feb 25\",\"Mar 25\",\"Apr 25\",\"May 25\",\"Jun 25\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[0.15,0.16,0.14,0.17,0.19,0.21,0.2,0.21,0.22,0.24,0.26,0.28],\"name\":\"Current Liabilities\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[0.65,0.68,0.62,0.73,0.79,0.86,0.82,0.87,0.93,0.98,1.06,1.14],\"name\":\"Equity\",\"stack\":\"total\"},{\"type\":\"bar\",\"data\":[0.2,0.22,0.18,0.25,0.28,0.32,0.3,0.32,0.35,0.38,0.42,0.45],\"name\":\"Non-current Liabilities\",\"stack\":\"total\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 24, "y": 4, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_balance_sheet_last_month",
              "title": "Balance Sheet as of the end of last month",
              "type": "graph",
              "filter": {},
              "data": "{\"xAxis\":{\"data\":[\"Assets\",\"Liabilities and Equity\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[0.5,0],\"name\":\"Long-term Assets\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0.32,0],\"name\":\"Other Current Assets\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0.86,0],\"name\":\"Bank\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0,1.125],\"name\":\"Non-current Liabilities\",\"stack\":\"liabilities\"},{\"type\":\"bar\",\"data\":[0,0.21],\"name\":\"Equity\",\"stack\":\"liabilities\"},{\"type\":\"bar\",\"data\":[0,0.19],\"name\":\"Current Liabilities\",\"stack\":\"liabilities\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 0, "y": 16, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            },
            {
              "id": "graph_balance_sheet_today",
              "title": "Balance Sheet as of today",
              "type": "graph",
              "filter": {},
              "data": "{\"xAxis\":{\"data\":[\"Assets\",\"Liabilities and Equity\"]},\"yAxis\":{},\"series\":[{\"type\":\"bar\",\"data\":[0.5,0],\"name\":\"Long-term Assets\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0.087,0],\"name\":\"Other Current Assets\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0.86,0],\"name\":\"Bank\",\"stack\":\"assets\"},{\"type\":\"bar\",\"data\":[0,1.125],\"name\":\"Non-current Liabilities\",\"stack\":\"liabilities\"},{\"type\":\"bar\",\"data\":[0,0.215],\"name\":\"Equity\",\"stack\":\"liabilities\"},{\"type\":\"bar\",\"data\":[0,0.033],\"name\":\"Current Liabilities\",\"stack\":\"liabilities\"}],\"tooltip\":{\"trigger\":\"axis\"}}",
              "position": { "x": 24, "y": 16, "w": 24, "h": 12, "minW": 16, "minH": 8 }
            }
          ]
        }
      ]
    
}