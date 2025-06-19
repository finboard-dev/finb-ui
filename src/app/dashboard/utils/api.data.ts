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
          "id": "metric_total_pl",
          "component_id": "comp_metric_value",
          "title": "Total P&L",
          "type": "metric",
          "filter": {},
          "data": { "value": 125000 },
          "position": { "x": 0, "y": 0, "w": 3, "h": 3, "minW": 2, "minH": 1 }
        },
        {
          "id": "table_pl_detail",
          "component_id": "comp_table",
          "title": "P&L Details",
          "type": "table",
          "filter": { "category": ["All"] },
          "data": "<table>\n        <tr>\n            <th>Firstname</th>\n            <th>Lastname</th>\n            <th>Age</th>\n        </tr>\n        <tr>\n            <td>Priya</td>\n            <td>Sharma</td>\n            <td>24</td>\n        </tr>\n        <tr>\n            <td>Arun</td>\n            <td>Singh</td>\n            <td>32</td>\n        </tr>\n        <tr>\n            <td>Sam</td>\n            <td>Watson</td>\n            <td>41</td>\n        </tr>\n    </table>",
          "position": { "x": 2, "y": 0, "w": 6, "h": 3, "minW": 4, "minH": 2 }
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
          "component_id": "comp_line_chart",
          "title": "Revenue Trend",
          "type": "graph",
          "filter": { "granularity": "monthly" },
          "data": "{\n   tooltip: {\n     trigger: 'axis',\n     axisPointer: {\n       type: 'shadow'\n     }\n   },\n   grid: {\n     left: '3%',\n     right: '4%',\n     bottom: '3%',\n     containLabel: true\n   },\n   xAxis: [\n     {\n       type: 'category',\n       data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],\n       axisTick: {\n         alignWithLabel: true\n       }\n     }\n   ],\n   yAxis: [\n     {\n       type: 'value'\n     }\n   ],\n   series: [\n     {\n       name: 'Direct',\n       type: 'bar',\n       barWidth: '60%',\n       data: [10, 52, 200, 334, 390, 330, 220]\n     }\n   ]\n }",
          "position": { "x": 0, "y": 0, "w": 8, "h": 4, "minW": 6, "minH": 3 }
        }
      ]
    }
  ]
}