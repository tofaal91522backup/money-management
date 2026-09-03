import type { BudgetSummary } from "@/features/budgets/types"
export async function getBudgets(month: string): Promise<BudgetSummary[]> { const response = await fetch(`/api/budgets?month=${month}`); if (!response.ok) throw new Error("We could not load budgets."); return response.json() as Promise<BudgetSummary[]> }
