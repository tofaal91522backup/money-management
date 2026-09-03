export type ReportData = {
  month: string
  income: number
  expense: number
  netCashFlow: number
  previousIncome: number
  previousExpense: number
  familySupport: number
  categoryExpenses: Array<{ name: string; amount: number }>
  incomeSources: Array<{ name: string; amount: number }>
  accountActivity: Array<{ name: string; income: number; expense: number; transfers: number }>
  topExpenses: Array<{ id: string; amount: number; date: string; categoryName: string; accountName: string }>
  loans: { receivable: number; payable: number; overdueCount: number }
}

export const reportsQueryKey = ["reports"] as const
