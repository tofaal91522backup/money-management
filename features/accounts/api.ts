import type { AccountSummary } from "@/features/accounts/types"

export const accountsQueryKey = ["accounts"] as const

export async function getAccounts(): Promise<AccountSummary[]> {
  const response = await fetch("/api/accounts")

  if (!response.ok) {
    throw new Error("We could not load your accounts. Please refresh and try again.")
  }

  return response.json() as Promise<AccountSummary[]>
}
