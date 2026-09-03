export type DashboardData = {
  totalBalance: number
  accountCount: number
  monthIncome: number
  monthExpense: number
  netCashFlow: number
  receivable: number
  payable: number
  overdueLoanCount: number
  hideBalances: boolean
  recentTransactions: Array<{ id: string; type: string; amount: number; date: string; note: string | null; categoryName: string | null; sourceAccountName: string | null; destinationAccountName: string | null }>
  topCategories: Array<{ name: string; amount: number }>
}
export const dashboardQueryKey = ["dashboard"] as const
