import type { TransactionFilters, TransactionListResponse } from "@/features/transactions/types"
export async function getTransactions(filters: TransactionFilters): Promise<TransactionListResponse> {
  const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, String(value)) })
  const response = await fetch(`/api/transactions?${params.toString()}`)
  if (!response.ok) throw new Error("We could not load transactions. Please refresh and try again.")
  return response.json() as Promise<TransactionListResponse>
}
