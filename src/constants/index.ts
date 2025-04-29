export const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzc2NDMxODYtNTBjMS00OWM2LWFhOGMtOWE5OTk3ZjgwYzQ3IiwiaWF0IjoxNzQ1MjI2MTIyLCJleHAiOjE3NzA0MjYxMjIsImNyZWF0ZWRfYXQiOiIyMDI1LTA0LTIxVDA5OjAyOjAyLjM4NDM1MSswMDowMCJ9.CRYhKW0NlwI_1cRA6u7V1RNE9PI6NMIvNEfFYbIUtcE'

export const REPORT_MENTIONS = [
  {
    name: "Profit & Loss",
    command: 'create a report for profit and loss',
  },
  {
    name: "Balance Sheet",
    command: 'create a report for balance sheet',
  },
  {
    name: "Cash Flow",
    command: 'create a report for cash flow',
  },
  {
    name: "Sales Report",
    command: 'create a report for sales',
  },
  {
    name: "Inventory Report",
    command: 'create a report for inventory',
  },
  {
    name: "Expense Report",
    command: 'create a report for expenses',
  },
]

export const FINANCIAL_REPORTS = [
  { id: "profit-loss", name: "Profit & Loss", icon: "📊" },
  { id: "balance-sheet", name: "Balance Sheet", icon: "📑" },
  { id: "cash-flow", name: "Cash Flow", icon: "💰" },
  { id: "income-statement", name: "Income Statement", icon: "📈" },
  { id: "annual-report", name: "Annual Report", icon: "📆" },
  { id: "quarterly-report", name: "Quarterly Report", icon: "🗓️" },
  { id: "expense-report", name: "Expense Report", icon: "💸" },
  { id: "tax-report", name: "Tax Report", icon: "📝" },
  { id: "budget-report", name: "Budget Analysis", icon: "🔍" },
  { id: "forecast-report", name: "Financial Forecast", icon: "🔮" },
];

export const ACCESS_TOKEN = 'access_token';
export const USER = 'user';
export const EMAIL = 'email';
export const IS_GOOGLE_CONNECTED = 'is_google_connected';
export const CSRF_TOKEN = 'csrf_token';
export const REDIRECT_TYPE = 'redirect_type';
export const SSO_LOGIN = 'SSO_LOGIN';
export const ADD_COMPANY = 'ADD_COMPANY';
export const ADD_APP = 'ADD_APP';
export const CONNECT_COMPANY = 'CONNECT_COMPANY';
export const DISCONNECT_COMPANY = 'DISCONNECT_COMPANY';
export const MAPPINGS = 'mappings'