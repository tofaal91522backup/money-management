export const categoryTypes = ["INCOME", "EXPENSE"] as const

export type CategoryType = (typeof categoryTypes)[number]

export type CategorySummary = {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  isDefault: boolean
  isArchived: boolean
}

export type CategoryFormState = {
  error?: string
  success?: boolean
}

export const categoryTypeLabels: Record<CategoryType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
}
