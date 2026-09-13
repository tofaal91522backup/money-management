import type { LoanPersonSummary, LoanSummary } from "@/features/loans/types"
export async function getLoans(): Promise<LoanSummary[]> { const response = await fetch("/api/loans"); if (!response.ok) throw new Error("We could not load loans."); return response.json() as Promise<LoanSummary[]> }
export async function getLoanPeople(): Promise<LoanPersonSummary[]> { const response = await fetch("/api/loan-people"); if (!response.ok) throw new Error("We could not load people."); return response.json() as Promise<LoanPersonSummary[]> }
