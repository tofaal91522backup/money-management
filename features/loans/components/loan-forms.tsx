"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import { formatMoney, parseMoneyInput } from "@/lib/money/currency"
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
      <button type="button" onClick={() => setType("RECEIVABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "RECEIVABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I gave money</button>
      <button type="button" onClick={() => setType("PAYABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "PAYABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I took money</button>
    </div>
    <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
      <input name="isOpeningLoan" type="checkbox" checked={isOpeningLoan} onChange={(event) => setIsOpeningLoan(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0"><strong className="font-medium">This is an old loan</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Record an existing {type === "RECEIVABLE" ? "receivable" : "payable"} without changing the selected account&apos;s current balance.</span></span>
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Person name<Input name="personName" defaultValue={loan?.personName} required maxLength={60} placeholder="Who is involved?" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Phone or note <span className={optionalLabel}>(optional)</span></span><Input name="personContact" defaultValue={loan?.personContact ?? ""} maxLength={80} /></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" defaultValue={loan ? String(loan.originalAmount / 100) : ""} required placeholder="0.00" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">{isOpeningLoan ? "Reference account" : type === "RECEIVABLE" ? "Lent from" : "Received in"}<select name="accountId" defaultValue={loan?.originAccount.id ?? ""} required className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">Select account</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Loan date<Input name="startDate" type="date" defaultValue={loan?.startDate.slice(0, 10) ?? today} required /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Due date <span className={optionalLabel}>(optional)</span></span><Input name="dueDate" type="date" defaultValue={loan?.dueDate?.slice(0, 10) ?? ""} /></label>
    </div>
    <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" defaultValue={loan?.note ?? ""} maxLength={300} /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending || activeAccounts.length === 0}>{pending ? "Saving…" : loan ? "Save changes" : "Save loan"}</Button>
  </form>
}

export function RepaymentForm({ loan, onSuccess }: { loan: LoanSummary; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(createRepaymentAction, initialState)
  const { data: accounts = [] } = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const { data: categories = [] } = useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories })
  const [amountInput, setAmountInput] = useState("")

  // Getting back more than you are owed is common (cash-out fee covered, or goodwill).
  // Only the remaining amount settles the loan; the rest is saved as ordinary income.
  const entered = parseMoneyInput(amountInput)
  const applied = entered === null ? 0 : Math.min(entered, loan.remainingAmount)
  const extra = entered === null ? 0 : entered - applied
  const extraType = loan.type === "RECEIVABLE" ? "INCOME" : "EXPENSE"
  const extraCategories = useMemo(() => categories.filter((category) => category.type === extraType && !category.isArchived), [categories, extraType])
  const fallbackCategory = extraCategories.find((category) => category.name === (extraType === "INCOME" ? "Other income" : "Other expense"))

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    <input type="hidden" name="loanId" value={loan.id} />
    <p className="rounded-lg bg-muted px-3 py-2 text-sm break-words">Remaining: <strong className="tabular-nums">{(loan.remainingAmount / 100).toFixed(2)}</strong></p>
    <label className="grid min-w-0 gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} required placeholder="0.00" /></label>

    {extra > 0 && <div className="grid gap-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
      <p className="text-xs text-muted-foreground">You received more than this loan needs, so it will be split:</p>
      <div className="grid gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">Closes this loan</span><strong className="shrink-0 tabular-nums">{formatMoney(applied)}</strong></div>
        <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">Extra, saved as {extraType === "INCOME" ? "income" : "expense"}</span><strong className="shrink-0 tabular-nums">{formatMoney(extra)}</strong></div>
      </div>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Extra goes to
        <select name="extraCategoryId" defaultValue={fallbackCategory?.id ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm">
          <option value="">Uncategorized</option>
          {extraCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
    </div>}

    <label className="grid min-w-0 gap-2 text-sm font-medium">{loan.type === "RECEIVABLE" ? "Received in" : "Paid from"}<select name="accountId" required className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">Select account</option>{accounts.filter((account) => !account.isArchived).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium">Date<Input name="date" type="date" defaultValue={today} required /></label>
    <label className="grid gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" maxLength={300} /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : extra > 0 ? `Add repayment + ${formatMoney(extra)} extra` : "Add repayment"}</Button>
  </form>
}

