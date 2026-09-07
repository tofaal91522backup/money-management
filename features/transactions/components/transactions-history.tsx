"use client"

import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getAccounts, accountsQueryKey } from "@/features/accounts/api"
import { getCategories, categoriesQueryKey } from "@/features/categories/api"
import { deleteTransactionAction } from "@/features/transactions/actions"
import { getTransactions } from "@/features/transactions/api"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { TransferForm } from "@/features/transactions/components/transfer-form"
import { transactionsQueryKey, type TransactionFilters, type TransactionSummary } from "@/features/transactions/types"
import { formatMoney } from "@/lib/money/currency"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialFilters: TransactionFilters = { page: 1, type: "", accountId: "", categoryId: "", search: "", startDate: "", endDate: "" }

export function TransactionsHistory() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [editing, setEditing] = useState<TransactionSummary | null>(null)
  const [deleting, setDeleting] = useState<TransactionSummary | null>(null)
  const accounts = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts }).data ?? []
  const categories = useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories }).data ?? []
  const query = useQuery({ queryKey: [...transactionsQueryKey, filters], queryFn: () => getTransactions(filters) })
  const pageCount = Math.max(1, Math.ceil((query.data?.total ?? 0) / (query.data?.pageSize ?? 12)))
  const setFilter = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => setFilters((current) => ({ ...current, [key]: value, page: key === "page" ? Number(value) : 1 }))
  const visibleCategories = useMemo(() => categories.filter((category) => !category.isArchived), [categories])

  return <section className="mt-10 border-t pt-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div className="min-w-0"><h2 className="text-xl font-semibold tracking-tight">History</h2><p className="mt-1 text-sm text-muted-foreground">Review, correct, or remove income, expense, and transfers.</p></div><Badge className="w-fit shrink-0" variant="secondary">{query.data?.total ?? 0} records</Badge></div>
    <div className="mt-5 grid min-w-0 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="relative min-w-0 sm:col-span-2"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} className="pl-9" placeholder="Search note or category" /></label><select value={filters.type} onChange={(event) => setFilter("type", event.target.value as TransactionFilters["type"])} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">All types</option><option value="EXPENSE">Expense</option><option value="INCOME">Income</option><option value="TRANSFER">Transfer</option></select><select value={filters.accountId} onChange={(event) => setFilter("accountId", event.target.value)} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select value={filters.categoryId} onChange={(event) => setFilter("categoryId", event.target.value)} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">All categories</option>{visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Input type="date" value={filters.startDate} onChange={(event) => setFilter("startDate", event.target.value)} aria-label="Start date" /><Input type="date" value={filters.endDate} onChange={(event) => setFilter("endDate", event.target.value)} aria-label="End date" /><Button variant="ghost" className="w-full sm:w-auto sm:justify-self-end" onClick={() => setFilters(initialFilters)}>Clear filters</Button></div>
    <div className="mt-5 grid min-w-0 gap-3">{query.isPending && <HistorySkeleton />}{query.isError && <EmptyState title="Could not load transactions" description="Your transactions are still safe. Please try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} />}{!query.isPending && !query.isError && query.data?.items.length === 0 && <EmptyState title="No transactions found" description="Try changing the filters, or add your first income or expense above." />}{query.data?.items.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onEdit={() => setEditing(transaction)} onDelete={() => setDeleting(transaction)} />)}</div>
    {query.data && query.data.total > query.data.pageSize && <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Page {filters.page} of {pageCount}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilter("page", filters.page - 1)}><ChevronLeft className="size-4" /> Previous</Button><Button variant="outline" size="sm" disabled={filters.page >= pageCount} onClick={() => setFilter("page", filters.page + 1)}>Next <ChevronRight className="size-4" /></Button></div></div>}
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit transaction</DialogTitle><DialogDescription>Balances and reports will update to match your changes.</DialogDescription></DialogHeader>{editing && (editing.type === "TRANSFER" ? <TransferForm transaction={editing} onSuccess={() => setEditing(null)} /> : <TransactionForm transaction={editing} onSuccess={() => setEditing(null)} />)}</DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Delete transaction?</DialogTitle><DialogDescription>This will remove the transaction and update the related account balance. This cannot be undone.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><form action={async (formData) => { await deleteTransactionAction(formData); await refreshAppData(queryClient); setDeleting(null) }}><input type="hidden" name="transactionId" value={deleting?.id ?? ""} /><Button variant="destructive" type="submit">Delete transaction</Button></form></DialogFooter></DialogContent></Dialog>
  </section>
}

function TransactionRow({ transaction, onEdit, onDelete }: { transaction: TransactionSummary; onEdit: () => void; onDelete: () => void }) {
  const isIncome = transaction.type === "INCOME"; const isTransfer = transaction.type === "TRANSFER"; const Icon = isTransfer ? ArrowRightLeft : isIncome ? ArrowDownLeft : ArrowUpRight
  const title = isTransfer ? `${transaction.sourceAccount?.name ?? "Unknown"} → ${transaction.destinationAccount?.name ?? "Unknown"}` : transaction.category?.name ?? "Uncategorized"
  const detail = isTransfer ? `Transfer${transaction.feeAmount ? ` · Fee ${formatMoney(transaction.feeAmount)}` : ""}` : transaction.account?.name ?? "Unknown account"
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isTransfer ? "bg-transfer text-transfer-foreground" : isIncome ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}`}><Icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="min-w-0 truncate font-semibold">{title}</p><Badge className="shrink-0" variant={isTransfer ? "transfer" : isIncome ? "success" : "destructive"}>{isTransfer ? "Transfer" : isIncome ? "Income" : "Expense"}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{detail} · {new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(transaction.date))}{transaction.note ? ` · ${transaction.note}` : ""}</p></div><div className="shrink-0 text-right"><p className={`font-semibold tabular-nums ${isTransfer ? "text-transfer-foreground" : isIncome ? "text-success-foreground" : "text-destructive"}`}>{isIncome ? "+" : isTransfer ? "↔" : "−"}{formatMoney(transaction.amount)}</p><div className="mt-1 flex justify-end"><Button variant="ghost" size="icon-xs" onClick={onEdit} aria-label="Edit transaction"><Pencil className="size-3.5" /></Button><Button variant="ghost" size="icon-xs" onClick={onDelete} aria-label="Delete transaction"><Trash2 className="size-3.5 text-destructive" /></Button></div></div></CardContent></Card>
}

function HistorySkeleton() { return <>{Array.from({ length: 3 }, (_, index) => <Card key={index}><CardContent className="flex gap-3 p-4"><Skeleton className="size-10 rounded-xl" /><div className="flex-1"><Skeleton className="h-5 w-32" /><Skeleton className="mt-2 h-4 w-48" /></div></CardContent></Card>)}</> }
