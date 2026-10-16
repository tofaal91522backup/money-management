export type ReportData = {
  month: string
  income: number
  expense: number
  netCashFlow: number
  previousIncome: number
  previousExpense: number
  family: { receivedThisMonth: number; spentThisMonth: number; totalReceived: number; totalSpent: number; left: number; received: Array<{ id: string; amount: number; date: string; note: string | null; accountName: string }>; spentByCategory: Array<{ name: string; amount: number }> }
  categoryExpenses: Array<{ name: string; amount: number }>
  incomeSources: Array<{ name: string; amount: number }>
  accountActivity: Array<{ name: string; income: number; expense: number; transfers: number }>
  dailyExpenses: Array<{ date: string; amount: number }>
  daysCounted: number
  averageDailyExpense: number
  topExpenses: Array<{ id: string; amount: number; date: string; categoryName: string; accountName: string }>
  loans: { receivable: number; payable: number; overdueCount: number }
}

export const reportsQueryKey = ["reports"] as const
