export type BudgetScope = "TOTAL" | "CATEGORY"
export type BudgetSummary = { id: string; scope: BudgetScope; amount: number; month: string; category: { id: string; name: string } | null; spent: number; progress: number }
export type BudgetFormState = { error?: string; success?: boolean }
export const budgetsQueryKey = ["budgets"] as const
