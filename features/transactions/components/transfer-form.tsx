"use client"

import { useActionState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRightLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { createTransferAction, updateTransferAction, type TransactionFormState } from "@/features/transactions/actions"
import { transactionsQueryKey, type TransactionSummary } from "@/features/transactions/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: TransactionFormState = {}
const today = new Date().toISOString().slice(0, 10)

export function TransferForm({ transaction, onSuccess }: { transaction?: TransactionSummary; onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(transaction ? updateTransferAction : createTransferAction, initialState)
  const accountsQuery = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const accounts = (accountsQuery.data ?? []).filter((account) => !account.isArchived)

  useEffect(() => { if (state.success) { void refreshAppData(queryClient); onSuccess?.() } }, [onSuccess, queryClient, state])
  if (accountsQuery.isPending) return <p className="text-sm text-muted-foreground">Loading accounts…</p>
  if (accountsQuery.isError) return <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">We could not load accounts for this transfer.</p>

  return <form action={formAction} className="grid gap-5">{transaction && <input type="hidden" name="transactionId" value={transaction.id} />}<div className="grid gap-4 xl:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Move from<select name="sourceAccountId" defaultValue={transaction?.sourceAccount?.id ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm" required><option value="">Select source account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="grid min-w-0 gap-2 text-sm font-medium">Move to<select name="destinationAccountId" defaultValue={transaction?.destinationAccount?.id ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm" required><option value="">Select destination account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div><div className="grid gap-4 xl:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Amount<Input name="amount" type="text" inputMode="decimal" defaultValue={transaction ? String(transaction.amount / 100) : ""} placeholder="0.00" required /></label><label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Transfer fee <span className="whitespace-nowrap font-normal text-muted-foreground">(optional)</span></span><Input name="feeAmount" type="text" inputMode="decimal" defaultValue={transaction ? String(transaction.feeAmount / 100) : "0"} /></label></div><div className="grid gap-4 xl:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Date<Input name="date" type="date" defaultValue={transaction ? transaction.date.slice(0, 10) : today} required /></label><label className="grid min-w-0 gap-2 text-sm font-medium"><span className="flex flex-wrap items-baseline gap-1">Note <span className="whitespace-nowrap font-normal text-muted-foreground">(optional)</span></span><Input name="note" defaultValue={transaction?.note ?? ""} maxLength={300} placeholder="e.g. Cash withdrawal" /></label></div>{state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}{state.success && !onSuccess && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">Transfer saved. Both balances are updated.</p>}<Button type="submit" size="lg" disabled={pending || accounts.length < 2}><ArrowRightLeft className="size-4" /> {pending ? "Saving…" : transaction ? "Save transfer" : "Move money"}</Button></form>
}
