export const accountTypes = ["CASH", "BANK", "MOBILE_WALLET", "SAVINGS", "OTHER"] as const

export type AccountType = (typeof accountTypes)[number]

export type AccountSummary = {
  id: string
  name: string
  type: AccountType
  openingBalance: number
  balance: number
  identifier: string | null
  color: string | null
  isArchived: boolean
}

export type AccountFormState = {
  error?: string
  success?: boolean
}

export const accountTypeLabels: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank account",
  MOBILE_WALLET: "Mobile wallet",
  SAVINGS: "Savings",
  OTHER: "Other",
}
