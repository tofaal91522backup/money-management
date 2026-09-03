import type { LoanSummary } from "@/features/loans/types"
export async function getLoans(): Promise<LoanSummary[]> { const response = await fetch("/api/loans"); if (!response.ok) throw new Error("We could not load loans."); return response.json() as Promise<LoanSummary[]> }
