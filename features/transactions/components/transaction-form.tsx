"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createTransactionAction, updateTransactionAction, type TransactionFormState } from "@/features/transactions/actions"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import type { CategoryType } from "@/features/categories/types"
import { transactionsQueryKey, type TransactionSummary } from "@/features/transactions/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: TransactionFormState = {}
const today = new Date().toISOString().slice(0, 10)

export function TransactionForm({ transaction, onSuccess }: { transaction?: TransactionSummary; onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<CategoryType>(transaction?.type === "INCOME" ? "INCOME" : "EXPENSE")
  const [state, formAction, pending] = useActionState(transaction ? updateTransactionAction : createTransactionAction, initialState)
  const accountsQuery = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const categoriesQuery = useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories })
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.isArchived)
  const categories = useMemo(() => (categoriesQuery.data ?? []).filter((category) => !category.isArchived && category.type === type), [categoriesQuery.data, type])

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess?.()
    }
  }, [onSuccess, queryClient, state])

  if (accountsQuery.isPending || categoriesQuery.isPending) {
    return <p className="text-sm text-muted-foreground">Loading accounts and categories…</p>
  }

  if (accountsQuery.isError || categoriesQuery.isError) {
    return <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">We could not load the information needed for this transaction.</p>
  }

  return (
    <form action={formAction} className="grid gap-5">
      {transaction && <input type="hidden" name="transactionId" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />
      <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
        <button type="button" onClick={() => setType("EXPENSE")} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${type === "EXPENSE" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}><ArrowUpRight className="size-4 text-destructive" /> Expense</button>
        <button type="button" onClick={() => setType("INCOME")} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${type === "INCOME" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}><ArrowDownLeft className="size-4 text-primary" /> Income</button>
      </div>
      <div className="grid gap-2"><label htmlFor="transaction-amount" className="text-sm font-medium">Amount</label><Input id="transaction-amount" name="amount" type="text" inputMode="decimal" defaultValue={transaction ? String(transaction.amount / 100) : undefined} placeholder="0.00" autoFocus required /></div>
      <div className="grid gap-4 xl:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">{type === "INCOME" ? "Deposit to" : "Pay from"}<select name="accountId" defaultValue={transaction?.account?.id ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25" required><option value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="grid min-w-0 gap-2 text-sm font-medium">Category<select name="categoryId" defaultValue={transaction?.category?.id ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25" required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
      <div className="grid gap-4 xl:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Date<Input name="date" type="date" defaultValue={transaction ? transaction.date.slice(0, 10) : today} required /></label><label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className="whitespace-nowrap font-normal text-muted-foreground">(optional)</span></span><Input name="note" type="text" defaultValue={transaction?.note ?? ""} placeholder="Add a short note" maxLength={300} /></label></div>
      {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
      {state.success && !onSuccess && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">Transaction saved. Your account balance has been updated.</p>}
      <Button type="submit" size="lg" disabled={pending || accounts.length === 0 || categories.length === 0}><Plus className="size-4" /> {pending ? "Saving…" : transaction ? "Save changes" : `Add ${type === "INCOME" ? "income" : "expense"}`}</Button>
    </form>
  )
}
