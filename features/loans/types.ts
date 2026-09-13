export type LoanType = "RECEIVABLE" | "PAYABLE"
export type LoanPerson = { id: string; name: string; contact: string | null; note: string | null }
export type LoanPersonSummary = LoanPerson & { createdAt: string; loanCount: number; receivableRemaining: number; payableRemaining: number }
export type LoanSummary = { id: string; personName: string; personContact: string | null; person: LoanPerson | null; type: LoanType; originalAmount: number; repaidAmount: number; remainingAmount: number; startDate: string; dueDate: string | null; note: string | null; status: string; isOpeningLoan: boolean; originAccount: { id: string; name: string }; repayments: Array<{ id: string; amount: number; date: string; note: string | null; account: { id: string; name: string } }> }
export type LoanFormState = { error?: string; success?: boolean; personId?: string }
export const loansQueryKey = ["loans"] as const
export const loanPeopleQueryKey = ["loan-people"] as const
