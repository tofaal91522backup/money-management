"use client"

import { useActionState, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { createLoanAction, createRepaymentAction, updateLoanAction } from "@/features/loans/actions"
import { loansQueryKey, type LoanFormState, type LoanSummary, type LoanType } from "@/features/loans/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: LoanFormState = {}
const today = new Date().toISOString().slice(0, 10)
const optionalLabel = "whitespace-nowrap font-normal text-muted-foreground"

export function LoanForm({ loan, onSuccess }: { loan?: LoanSummary; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<LoanType>(loan?.type ?? "RECEIVABLE")
  const [isOpeningLoan, setIsOpeningLoan] = useState(loan?.isOpeningLoan ?? false)
  const [state, formAction, pending] = useActionState(loan ? updateLoanAction : createLoanAction, initialState)
  const { data: accounts = [] } = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const activeAccounts = accounts.filter((account) => !account.isArchived)

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    {loan && <input type="hidden" name="loanId" value={loan.id} />}
    <input type="hidden" name="type" value={type} />
    <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
      <button type="button" onClick={() => setType("RECEIVABLE")} className={`rounded-md px-3 py-2 text-sm font-medium ${type === "RECEIVABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I gave money</button>
      <button type="button" onClick={() => setType("PAYABLE")} className={`rounded-md px-3 py-2 text-sm font-medium ${type === "PAYABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I took money</button>
    </div>
    <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
      <input name="isOpeningLoan" type="checkbox" checked={isOpeningLoan} onChange={(event) => setIsOpeningLoan(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span><strong className="font-medium">This is an old loan</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Record an existing {type === "RECEIVABLE" ? "receivable" : "payable"} without changing the selected account&apos;s current balance.</span></span>
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Person name<Input name="personName" defaultValue={loan?.personName} required maxLength={60} placeholder="Who is involved?" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="inline-flex items-baseline gap-1">Phone or note <span className={optionalLabel}>(optional)</span></span><Input name="personContact" defaultValue={loan?.personContact ?? ""} maxLength={80} /></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" defaultValue={loan ? String(loan.originalAmount / 100) : ""} required placeholder="0.00" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">{isOpeningLoan ? "Reference account" : type === "RECEIVABLE" ? "Lent from" : "Received in"}<select name="accountId" defaultValue={loan?.originAccount.id ?? ""} required className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">Select account</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Loan date<Input name="startDate" type="date" defaultValue={loan?.startDate.slice(0, 10) ?? today} required /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="inline-flex items-baseline gap-1">Due date <span className={optionalLabel}>(optional)</span></span><Input name="dueDate" type="date" defaultValue={loan?.dueDate?.slice(0, 10) ?? ""} /></label>
    </div>
    <label className="grid gap-2 text-sm font-medium"><span className="inline-flex items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" defaultValue={loan?.note ?? ""} maxLength={300} /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending || activeAccounts.length === 0}>{pending ? "Saving…" : loan ? "Save changes" : "Save loan"}</Button>
  </form>
}

export function RepaymentForm({ loan, onSuccess }: { loan: LoanSummary; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(createRepaymentAction, initialState)
  const { data: accounts = [] } = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    <input type="hidden" name="loanId" value={loan.id} />
    <p className="rounded-lg bg-muted px-3 py-2 text-sm">Remaining: <strong>{(loan.remainingAmount / 100).toFixed(2)}</strong></p>
    <label className="grid gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" required placeholder="0.00" /></label>
    <label className="grid gap-2 text-sm font-medium">{loan.type === "RECEIVABLE" ? "Received in" : "Paid from"}<select name="accountId" required className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="">Select account</option>{accounts.filter((account) => !account.isArchived).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <label className="grid gap-2 text-sm font-medium">Date<Input name="date" type="date" defaultValue={today} required /></label>
    <label className="grid gap-2 text-sm font-medium"><span className="inline-flex items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" maxLength={300} /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add repayment"}</Button>
  </form>
}
