export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER"
export type TransactionSummary = { id: string; type: TransactionType; amount: number; feeAmount: number; date: string; note: string | null; category: { id: string; name: string; color: string | null } | null; account: { id: string; name: string } | null; sourceAccount: { id: string; name: string } | null; destinationAccount: { id: string; name: string } | null }
export type TransactionFilters = { page: number; type: "" | TransactionType; accountId: string; categoryId: string; search: string; startDate: string; endDate: string }
export type TransactionListResponse = { items: TransactionSummary[]; total: number; page: number; pageSize: number }
export const transactionsQueryKey = ["transactions"] as const
