"use client"

import { ArrowDownLeft, ArrowUpRight, HandCoins, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getReport } from "@/features/reports/api"
import { reportsQueryKey, type ReportData } from "@/features/reports/types"
import { formatMoney } from "@/lib/money/currency"

const currentMonth = new Date().toISOString().slice(0, 7)

export function ReportsScreen() {
  const [month, setMonth] = useState(currentMonth)
  const query = useQuery({ queryKey: [...reportsQueryKey, month], queryFn: () => getReport(month) })

  if (query.isPending) return <ReportsSkeleton />
  if (query.isError || !query.data) return <EmptyState title="Could not load report" description="Your data is still safe. Please try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} />

  return <Report data={query.data} month={month} onMonthChange={setMonth} />
}

function Report({ data, month, onMonthChange }: { data: ReportData; month: string; onMonthChange: (month: string) => void }) {
  const maxFlow = Math.max(data.income, data.expense, 1)
  const incomeChange = percentChange(data.income, data.previousIncome)
  const expenseChange = percentChange(data.expense, data.previousExpense)

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1><p className="mt-1 text-sm text-muted-foreground">See where your money came from and where it went.</p></div><Input className="w-full sm:w-44" type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="Income" amount={data.income} change={incomeChange} icon={ArrowDownLeft} positive /><Summary label="Expense" amount={data.expense} change={expenseChange} icon={ArrowUpRight} /><Summary label="Net cash flow" amount={data.netCashFlow} icon={data.netCashFlow >= 0 ? TrendingUp : TrendingDown} positive={data.netCashFlow >= 0} /></div>
    <Card><CardHeader><CardTitle>Income vs expense</CardTitle></CardHeader><CardContent className="grid gap-5"><FlowBar label="Income" amount={data.income} max={maxFlow} className="bg-primary" /><FlowBar label="Expense" amount={data.expense} max={maxFlow} className="bg-destructive" /></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Breakdown title="Expense by category" items={data.categoryExpenses} total={data.expense} empty="No expenses this month." /><Breakdown title="Income sources" items={data.incomeSources} total={data.income} empty="No income this month." /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Family support received</p><p className="mt-2 text-2xl font-semibold">{formatMoney(data.familySupport)}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total receivable</p><p className="mt-2 text-2xl font-semibold text-success-foreground">{formatMoney(data.loans.receivable)}</p></CardContent></Card><Card><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Total payable</p>{data.loans.overdueCount > 0 && <Badge variant="destructive">{data.loans.overdueCount} overdue</Badge>}</div><p className="mt-2 text-2xl font-semibold text-warning-foreground">{formatMoney(data.loans.payable)}</p></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Account activity</CardTitle></CardHeader><CardContent>{data.accountActivity.length === 0 ? <p className="text-sm text-muted-foreground">No account activity this month.</p> : <div className="grid gap-4">{data.accountActivity.map((account) => <div key={account.name} className="border-b pb-3 last:border-0"><p className="text-sm font-semibold">{account.name}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>In {formatMoney(account.income)}</span><span>Out {formatMoney(account.expense)}</span><span>Moved {formatMoney(account.transfers)}</span></div></div>)}</div>}</CardContent></Card><Card><CardHeader><CardTitle>Largest expenses</CardTitle></CardHeader><CardContent>{data.topExpenses.length === 0 ? <p className="text-sm text-muted-foreground">No expenses this month.</p> : <div className="grid gap-4">{data.topExpenses.map((expense) => <div key={expense.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{expense.categoryName}</p><p className="mt-0.5 text-xs text-muted-foreground">{expense.accountName} · {new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short" }).format(new Date(expense.date))}</p></div><span className="shrink-0 text-sm font-semibold text-destructive">−{formatMoney(expense.amount)}</span></div>)}</div>}</CardContent></Card></div>
  </div>
}

function Summary({ label, amount, change, icon: Icon, positive = false }: { label: string; amount: number; change?: number | null; icon: typeof WalletCards; positive?: boolean }) { return <Card><CardContent className="p-5"><div className={`grid size-9 place-items-center rounded-lg ${positive ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}`}><Icon className="size-4" /></div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{formatMoney(amount)}</p>{change !== undefined && change !== null && <p className={`mt-2 text-xs ${change <= 0 && label === "Expense" ? "text-success-foreground" : "text-muted-foreground"}`}>{Math.abs(change)}% {change >= 0 ? "higher" : "lower"} than last month</p>}</CardContent></Card> }
function FlowBar({ label, amount, max, className }: { label: string; amount: number; max: number; className: string }) { return <div><div className="mb-2 flex justify-between text-sm"><span>{label}</span><strong>{formatMoney(amount)}</strong></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(amount ? 4 : 0, amount / max * 100)}%` }} /></div></div> }
function Breakdown({ title, items, total, empty }: { title: string; items: Array<{ name: string; amount: number }>; total: number; empty: string }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="grid gap-4">{items.map((item) => <div key={item.name}><div className="flex justify-between text-sm"><span>{item.name}</span><strong>{formatMoney(item.amount)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? item.amount / total * 100 : 0}%` }} /></div></div>)}</div>}</CardContent></Card> }
function percentChange(current: number, previous: number) { if (!previous) return current ? 100 : null; return Math.round((current - previous) / previous * 100) }
function ReportsSkeleton() { return <div className="grid gap-6"><Skeleton className="h-20 w-72" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-36" />)}</div><Skeleton className="h-64" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div> }
