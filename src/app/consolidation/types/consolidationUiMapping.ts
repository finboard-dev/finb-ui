import { ConsolidationTabs } from "./consolidationTabs";

export const ACCOUNT_COLUMNS = [
  { key: "income", label: "Income" },
  { key: "cogs", label: "COGS" },
  { key: "expenses", label: "Expense" },
  { key: "other_income", label: "Other income" },
  { key: "other_expenses", label: "Other Expense" },
];

export const REPORT_TYPES = [
  { label: ConsolidationTabs.ProfitAndLoss, value: "ProfitAndLoss" },
  { label: ConsolidationTabs.BalanceSheet, value: "BalanceSheet" },
  { label: ConsolidationTabs.CashFlow, value: "CashFlow" },
];

export type Account = {
  account_id: string;
  realm_id: string | null;
  title: string;
  children: Account[];
  mapped_account: any[];
};

export type Mapping = {
  [key: string]: Account[];
};

export const ReportTypes = {
  assets: "Assets",
  equity: "Equity",
  liabilities_and_equity: "Liabilities and Equity",
  financing: "Financing",
  investing: "Investing",
  operating: "Operating",
  cogs: "Cogs",
  expenses: "Expense",
  income: "Income",
  other_expenses: "Other Expenses",
  other_income: "Other Income",
  beginning_cash: "Cash at beginning of period",
};

export const REPORT_TYPE_COLUMNS: Record<string, { key: string; label: string }[]> = {
  ProfitAndLoss: [
    { key: "income", label: ReportTypes.income },
    { key: "other_income", label: ReportTypes.other_income },
    { key: "cogs", label: ReportTypes.cogs },
    { key: "other_expenses", label: ReportTypes.other_expenses },
    { key: "expenses", label: ReportTypes.expenses },
  ],
  BalanceSheet: [
    {
      key: "liabilities_and_equity",
      label: ReportTypes.liabilities_and_equity,
    },
    { key: "assets", label: ReportTypes.assets },
  ],
  CashFlow: [
    { key: "financing", label: ReportTypes.financing },
    { key: "operating", label: ReportTypes.operating },
    { key: "investing", label: ReportTypes.investing },
    { key: "beginning_cash", label: ReportTypes.beginning_cash },
  ],
};