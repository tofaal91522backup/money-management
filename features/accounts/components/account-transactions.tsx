"use client"

import { ArrowDownLeft, ArrowLeft, ArrowRightLeft, ArrowUpRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { accountTypeLabels } from "@/features/accounts/types"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import { getTransactions } from "@/features/transactions/api"
import { transactionsQueryKey, type TransactionFilters, type TransactionSummary } from "@/features/transactions/types"
import { formatMoney } from "@/lib/money/currency"

type Period = "ALL" | "MONTH" | "30D" | "CUSTOM"

const typeTabs = [{ value: "", label: "All" }, { value: "INCOME", label: "Money in" }, { value: "EXPENSE", label: "Expense" }, { value: "TRANSFER", label: "Transfers" }] as const
const periodTabs = [{ value: "ALL", label: "All time" }, { value: "MONTH", label: "This month" }, { value: "30D", label: "Last 30 days" }, { value: "CUSTOM", label: "Custom" }] as const

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const dayLabel = (value: string) => new Intl.DateTimeFormat("en-BD", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value))

function periodRange(period: Period) {
  const now = new Date()
  if (period === "MONTH") return { startDate: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: "" }
  if (period === "30D") return { startDate: dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)), endDate: "" }
  return { startDate: "", endDate: "" }
}

const chip = (active: boolean) => `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`

export function AccountTransactions({ accountId }: { accountId: string }) {
  const [period, setPeriod] = useState<Period>("ALL")
  const [showMore, setShowMore] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, type: "", accountId, categoryId: "", search: "", startDate: "", endDate: "" })
  const accounts = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const categories = (useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories }).data ?? []).filter((category) => !category.isArchived)
  const query = useQuery({ queryKey: [...transactionsQueryKey, filters], queryFn: () => getTransactions(filters), placeholderData: (previous) => previous })
  const account = accounts.data?.find((item) => item.id === accountId)

  const update = (patch: Partial<TransactionFilters>) => setFilters((current) => ({ ...current, ...patch, page: 1 }))
  const choosePeriod = (next: Period) => { setPeriod(next); if (next !== "CUSTOM") update(periodRange(next)); else setShowMore(true) }
  const activeCount = [filters.categoryId, filters.search, period !== "ALL" ? "p" : ""].filter(Boolean).length + (filters.type ? 1 : 0)
  const reset = () => { setPeriod("ALL"); setFilters({ page: 1, type: "", accountId, categoryId: "", search: "", startDate: "", endDate: "" }) }

  const data = query.data
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 12)))
  const groups = (data?.items ?? []).reduce<Array<{ day: string; items: TransactionSummary[] }>>((acc, item) => {
    const day = item.date.slice(0, 10)
    const last = acc[acc.length - 1]
    if (last?.day === day) last.items.push(item); else acc.push({ day, items: [item] })
    return acc
  }, [])

  if (accounts.isSuccess && !account) return <EmptyState title="Account not found" description="It may have been removed." action={<Button asChild><Link href="/accounts">Back to accounts</Link></Button>} />

  return <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
    <div className="min-w-0">
      <Link href="/accounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Accounts</Link>
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0"><h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{account?.name ?? "Account"}</h1><p className="mt-1 truncate text-sm text-muted-foreground">{account ? `${accountTypeLabels[account.type]}${account.identifier ? ` · ${account.identifier}` : ""}` : "Loading…"}</p></div>
        {account?.isArchived && <Badge className="w-fit" variant="secondary">Archived</Badge>}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Card className="col-span-2 bg-primary text-primary-foreground sm:col-span-1"><CardContent className="p-4"><p className="text-xs text-primary-foreground/75">Current balance</p><p className="mt-1 text-2xl font-semibold break-words tabular-nums">{account ? formatMoney(account.balance) : "—"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowDownLeft className="size-3.5 text-primary" /> Money in</p><p className="mt-1 text-lg font-semibold break-words tabular-nums text-success-foreground">{data?.summary ? formatMoney(data.summary.inflow) : "—"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="size-3.5 text-destructive" /> Money out</p><p className="mt-1 text-lg font-semibold break-words tabular-nums text-destructive">{data?.summary ? formatMoney(data.summary.outflow) : "—"}</p></CardContent></Card>
    </div>
    <p className="-mt-3 text-xs text-muted-foreground">Money in and out follow the filters below{activeCount ? " (filtered)" : " (all time)"}.</p>

    <Card><CardContent className="grid min-w-0 gap-3 p-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Transaction type">{typeTabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={filters.type === tab.value} className={chip(filters.type === tab.value)} onClick={() => update({ type: tab.value })}>{tab.label}</button>)}</div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Time period">{periodTabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={period === tab.value} className={chip(period === tab.value)} onClick={() => choosePeriod(tab.value)}>{tab.label}</button>)}</div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={filters.search} onChange={(event) => update({ search: event.target.value })} placeholder="Search note or category" /></label>
        <Button type="button" variant="outline" className="shrink-0" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}><SlidersHorizontal className="size-4" /> <span className="hidden sm:inline">More</span></Button>
      </div>
      {showMore && <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 border-t pt-3 sm:grid-cols-3">
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Category<select value={filters.categoryId} onChange={(event) => update({ categoryId: event.target.value })} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm text-foreground"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">From<Input className="min-w-0" type="date" value={filters.startDate} onChange={(event) => { setPeriod("CUSTOM"); update({ startDate: event.target.value }) }} /></label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">To<Input className="min-w-0" type="date" value={filters.endDate} onChange={(event) => { setPeriod("CUSTOM"); update({ endDate: event.target.value }) }} /></label>
      </div>}
      <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{data ? `${data.total} ${data.total === 1 ? "transaction" : "transactions"}` : "Loading…"}</span>{activeCount > 0 && <Button variant="ghost" size="sm" onClick={reset}>Clear filters</Button>}</div>
    </CardContent></Card>

    <div className="grid min-w-0 gap-5">
      {query.isPending && Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-16" />)}
      {query.isError && <EmptyState title="Could not load transactions" description="Please try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} />}
      {data && data.items.length === 0 && <EmptyState title="No transactions found" description={activeCount ? "Try clearing some filters." : "Nothing has been recorded for this account yet."} action={activeCount ? <Button variant="outline" onClick={reset}>Clear filters</Button> : undefined} />}
      {groups.map((group) => <section key={group.day} className="grid gap-2"><h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{dayLabel(group.day)}</h2>{group.items.map((item) => <Row key={item.id} transaction={item} accountId={accountId} />)}</section>)}
    </div>

    {data && data.total > data.pageSize && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Page {filters.page} of {pageCount}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><ChevronLeft className="size-4" /> Previous</Button><Button variant="outline" size="sm" disabled={filters.page >= pageCount} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next <ChevronRight className="size-4" /></Button></div></div>}
  </div>
}

function Row({ transaction, accountId }: { transaction: TransactionSummary; accountId: string }) {
  const isTransfer = transaction.type === "TRANSFER"
  const incoming = transaction.type === "INCOME" || (isTransfer && transaction.destinationAccount?.id === accountId)
  const Icon = isTransfer ? ArrowRightLeft : incoming ? ArrowDownLeft : ArrowUpRight
  const title = isTransfer ? (incoming ? `From ${transaction.sourceAccount?.name ?? "Unknown"}` : `To ${transaction.destinationAccount?.name ?? "Unknown"}`) : transaction.category?.name ?? "Uncategorized"
  const fee = isTransfer && !incoming && transaction.feeAmount > 0 ? ` · Fee ${formatMoney(transaction.feeAmount)}` : ""
  const sub = `${isTransfer ? "Transfer" : incoming ? "Income" : "Expense"}${transaction.isFamilySupport ? " · Family support" : ""}${fee}${transaction.note ? ` · ${transaction.note}` : ""}`

  return <Card><CardContent className="flex items-center gap-3 p-3 sm:p-4">
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isTransfer ? "bg-transfer text-transfer-foreground" : incoming ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}`}><Icon className="size-5" /></span>
    <div className="min-w-0 flex-1"><p className="truncate font-medium">{title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p></div>
    <p className={`shrink-0 font-semibold tabular-nums ${incoming ? "text-success-foreground" : "text-destructive"}`}>{incoming ? "+" : "−"}{formatMoney(transaction.amount)}</p>
  </CardContent></Card>
}
