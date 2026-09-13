"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import { formatMoney, parseMoneyInput } from "@/lib/money/currency"
import { createLoanAction, createLoanPersonAction, createRepaymentAction, deleteLoanPersonAction, updateLoanAction, updateLoanPersonAction } from "@/features/loans/actions"
import { getLoanPeople } from "@/features/loans/api"
import { loanPeopleQueryKey, type LoanFormState, type LoanPersonSummary, type LoanSummary, type LoanType } from "@/features/loans/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: LoanFormState = {}
const today = new Date().toISOString().slice(0, 10)
const optionalLabel = "whitespace-nowrap font-normal text-muted-foreground"
const newPersonChoice = "__new"

export function PersonForm({ person, onSuccess }: { person?: LoanPersonSummary; onSuccess: (personId?: string) => void }) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(person ? updateLoanPersonAction : createLoanPersonAction, initialState)

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess(state.personId)
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    {person && <input type="hidden" name="personId" value={person.id} />}
    <label className="grid min-w-0 gap-2 text-sm font-medium">Name<Input name="name" defaultValue={person?.name} required maxLength={60} placeholder="Who is this?" /></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Phone <span className={optionalLabel}>(optional)</span></span><Input name="contact" defaultValue={person?.contact ?? ""} maxLength={80} /></label>
    <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" defaultValue={person?.note ?? ""} maxLength={300} placeholder="How you know them, where they are from…" /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : person ? "Save changes" : "Add person"}</Button>
  </form>
}

export function DeletePersonForm({ person, onCancel, onSuccess }: { person: LoanPersonSummary; onCancel: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(deleteLoanPersonAction, initialState)

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    <input type="hidden" name="personId" value={person.id} />
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Deleting…" : "Delete person"}</Button>
    </div>
  </form>
}

export function LoanForm({ loan, personId, onSuccess }: { loan?: LoanSummary; personId?: string; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<LoanType>(loan?.type ?? "RECEIVABLE")
  const [isOpeningLoan, setIsOpeningLoan] = useState(loan?.isOpeningLoan ?? false)
  // Editing never moves money unless it is asked for, so a fixed name or date
  // cannot quietly change an account balance.
  const [adjustBalance, setAdjustBalance] = useState(false)
  const [person, setPerson] = useState(loan?.person?.id ?? personId ?? "")
  const [amountInput, setAmountInput] = useState(loan ? String(loan.originalAmount / 100) : "")
  const [accountId, setAccountId] = useState(loan?.originAccount.id ?? "")
  const [state, formAction, pending] = useActionState(loan ? updateLoanAction : createLoanAction, initialState)
  const { data: accounts = [] } = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const { data: people = [] } = useQuery({ queryKey: loanPeopleQueryKey, queryFn: getLoanPeople })
  const activeAccounts = accounts.filter((account) => !account.isArchived)

  const enteredAmount = parseMoneyInput(amountInput)
  const amountChanged = Boolean(loan) && enteredAmount !== null && enteredAmount !== loan?.originalAmount
  const accountChanged = Boolean(loan) && accountId !== loan?.originAccount.id
  const recordedAmount = loan && !loan.isOpeningLoan ? loan.originalAmount : null

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    {loan && <input type="hidden" name="loanId" value={loan.id} />}
    <input type="hidden" name="type" value={type} />
    <input type="hidden" name="personId" value={person === newPersonChoice ? "" : person} />
    <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
      <button type="button" onClick={() => setType("RECEIVABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "RECEIVABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I gave money</button>
      <button type="button" onClick={() => setType("PAYABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "PAYABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I took money</button>
    </div>

    <label className="grid min-w-0 gap-2 text-sm font-medium">Person
      <select value={person} onChange={(event) => setPerson(event.target.value)} required className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm">
        <option value="">Select person</option>
        {people.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        <option value={newPersonChoice}>+ Someone new…</option>
      </select>
    </label>
    {person === newPersonChoice && <div className="grid gap-4 rounded-lg border border-primary/25 bg-primary/5 p-3 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">New person&apos;s name<Input name="personName" required maxLength={60} placeholder="Who is involved?" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Phone <span className={optionalLabel}>(optional)</span></span><Input name="personContact" maxLength={80} /></label>
    </div>}

    {(!loan || adjustBalance) && <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
      <input name="isOpeningLoan" type="checkbox" checked={isOpeningLoan} onChange={(event) => setIsOpeningLoan(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0"><strong className="font-medium">This is an old loan</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Record an existing {type === "RECEIVABLE" ? "receivable" : "payable"} without changing the selected account&apos;s current balance.</span></span>
    </label>}

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} required placeholder="0.00" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">{isOpeningLoan ? "Reference account" : type === "RECEIVABLE" ? "Lent from" : "Received in"}<select name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)} required className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">Select account</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid min-w-0 gap-2 text-sm font-medium">Loan date<Input name="startDate" type="date" defaultValue={loan?.startDate.slice(0, 10) ?? today} required /></label>
      <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Due date <span className={optionalLabel}>(optional)</span></span><Input name="dueDate" type="date" defaultValue={loan?.dueDate?.slice(0, 10) ?? ""} /></label>
    </div>
    <label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className={optionalLabel}>(optional)</span></span><Input name="note" defaultValue={loan?.note ?? ""} maxLength={300} /></label>

    {loan && <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      <input name="adjustBalance" type="checkbox" checked={adjustBalance} onChange={(event) => setAdjustBalance(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0"><strong className="font-medium">Also update the account balance</strong><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{adjustBalance ? "The money movement saved with this loan is rewritten to match, so the account balance changes." : "Only the loan record changes. Every account balance stays exactly where it is."}</span></span>
    </label>}

    {loan && !adjustBalance && (amountChanged || accountChanged) && <p className="rounded-lg border border-warning-foreground/20 bg-warning px-3 py-2 text-xs leading-5">
      {amountChanged && recordedAmount !== null ? <>This loan will say {formatMoney(enteredAmount ?? 0)} while the money movement stays at {formatMoney(recordedAmount)}. </> : null}
      {accountChanged ? <>The loan moves to another account, but the money stays counted against {loan.originAccount.name}. </> : null}
      Tick the box above if the balance should follow this change.
    </p>}

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
