"use client"

import { ArrowDownLeft, ArrowUpRight, HandCoins, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1><p className="mt-1 text-sm text-muted-foreground">See where your money came from and where it went.</p></div><Input className="w-full sm:w-44" type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="Income" amount={data.income} change={incomeChange} icon={ArrowDownLeft} positive /><Summary label="Expense" amount={data.expense} change={expenseChange} icon={ArrowUpRight} /><Summary label="Net cash flow" amount={data.netCashFlow} icon={data.netCashFlow >= 0 ? TrendingUp : TrendingDown} positive={data.netCashFlow >= 0} /></div>
    <Card><CardHeader><CardTitle>Income vs expense</CardTitle></CardHeader><CardContent className="grid gap-5"><FlowBar label="Income" amount={data.income} max={maxFlow} className="bg-primary" /><FlowBar label="Expense" amount={data.expense} max={maxFlow} className="bg-destructive" /></CardContent></Card>
    <DailySpending data={data} />
    <div className="grid gap-6 lg:grid-cols-2"><Breakdown title="Expense by category" items={data.categoryExpenses} total={data.expense} empty="No expenses this month." /><Breakdown title="Income sources" items={data.incomeSources} total={data.income} empty="No income this month." /></div>
    <div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Family support received</p><p className="mt-2 text-2xl font-semibold break-words tabular-nums">{formatMoney(data.familySupport)}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total receivable</p><p className="mt-2 text-2xl font-semibold break-words tabular-nums text-success-foreground">{formatMoney(data.loans.receivable)}</p></CardContent></Card><Card><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="min-w-0 truncate text-sm text-muted-foreground">Total payable</p>{data.loans.overdueCount > 0 && <Badge className="shrink-0" variant="destructive">{data.loans.overdueCount} overdue</Badge>}</div><p className="mt-2 text-2xl font-semibold break-words tabular-nums text-warning-foreground">{formatMoney(data.loans.payable)}</p></CardContent></Card></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Account activity</CardTitle></CardHeader><CardContent>{data.accountActivity.length === 0 ? <p className="text-sm text-muted-foreground">No account activity this month.</p> : <div className="grid min-w-0 gap-4">{data.accountActivity.map((account) => <div key={account.name} className="min-w-0 border-b pb-3 last:border-0"><p className="truncate text-sm font-semibold">{account.name}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted-foreground"><span>In {formatMoney(account.income)}</span><span>Out {formatMoney(account.expense)}</span><span>Moved {formatMoney(account.transfers)}</span></div></div>)}</div>}</CardContent></Card><Card><CardHeader><CardTitle>Largest expenses</CardTitle></CardHeader><CardContent>{data.topExpenses.length === 0 ? <p className="text-sm text-muted-foreground">No expenses this month.</p> : <div className="grid min-w-0 gap-4">{data.topExpenses.map((expense) => <div key={expense.id} className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{expense.categoryName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{expense.accountName} · {new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short" }).format(new Date(expense.date))}</p></div><span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">−{formatMoney(expense.amount)}</span></div>)}</div>}</CardContent></Card></div>
  </div>
}

function DailySpending({ data }: { data: ReportData }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const days = data.dailyExpenses
  const max = Math.max(...days.map((day) => day.amount), 1)
  const spentDays = days.filter((day) => day.amount > 0)
  const busiest = spentDays.reduce<ReportData["dailyExpenses"][number] | null>((top, day) => (!top || day.amount > top.amount ? day : top), null)
  const average = data.averageDailyExpense
  const selected = days.find((day) => day.date === selectedDate) ?? null

  return <Card><CardHeader className="gap-1"><CardTitle>Daily spending</CardTitle><CardDescription>How much went out on each day of the month.</CardDescription></CardHeader><CardContent className="grid gap-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <DailyStat label="Average per day" value={formatMoney(average)} hint={data.daysCounted ? `Across ${data.daysCounted} ${data.daysCounted === 1 ? "day" : "days"}` : "No days counted yet"} />
      <DailyStat label="Highest day" value={busiest ? formatMoney(busiest.amount) : formatMoney(0)} hint={busiest ? formatDay(busiest.date) : "No expenses yet"} />
      <DailyStat className="col-span-2 sm:col-span-1" label="Days with spending" value={`${spentDays.length} of ${days.length}`} hint={`${days.length - spentDays.length} no-spend ${days.length - spentDays.length === 1 ? "day" : "days"}`} />
    </div>

    {spentDays.length === 0 ? <p className="text-sm text-muted-foreground">No expenses recorded this month.</p> : <div className="grid min-w-0 gap-2">
      <div aria-live="polite" className="flex min-h-10 min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border bg-muted/40 px-3 py-2">
        {selected
          ? <><span className="min-w-0 truncate text-sm font-medium">{formatDay(selected.date)}</span><span className={`shrink-0 text-sm font-semibold tabular-nums ${selected.amount > average && average > 0 ? "text-destructive" : ""}`}>{formatMoney(selected.amount)}{selected.amount === 0 ? " · no spending" : ""}</span></>
          : <span className="text-xs text-muted-foreground">Tap any bar to see that day&apos;s total.</span>}
      </div>
      <div className="relative flex h-32 min-w-0 items-end gap-px">
        {average > 0 && <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/40" style={{ bottom: `${Math.min(average / max * 100, 100)}%` }} />}
        {days.map((day) => {
          const isSelected = day.date === selectedDate
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : day.date)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(day.date)}: ${formatMoney(day.amount)}`}
              title={`${formatDay(day.date)} · ${formatMoney(day.amount)}`}
              className={`flex h-full min-w-0 flex-1 items-end rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${isSelected ? "bg-muted" : "hover:bg-muted/50"}`}
            >
              <div className={`w-full rounded-t-[2px] ${day.amount > 0 ? (day.amount > average && average > 0 ? "bg-destructive/70" : "bg-primary") : "bg-muted-foreground/25"} ${isSelected ? "ring-2 ring-foreground/60" : ""}`} style={{ height: day.amount > 0 ? `${Math.max(day.amount / max * 100, 4)}%` : "2px" }} />
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>Day 1</span><span className="hidden sm:inline">Day {Math.ceil(days.length / 2)}</span><span>Day {days.length}</span></div>
      {average > 0 && <p className="text-xs text-muted-foreground"><span className="mr-1.5 inline-block h-2 w-3 rounded-sm bg-destructive/70 align-middle" />Days above your {formatMoney(average)} daily average</p>}
    </div>}

    {spentDays.length > 0 && <div className="grid min-w-0 gap-3 border-t pt-4">
      <p className="text-sm font-medium">Top spending days</p>
      {[...spentDays].sort((a, b) => b.amount - a.amount).slice(0, 5).map((day) => (
        <button key={day.date} type="button" onClick={() => setSelectedDate(day.date)} className={`flex min-w-0 items-center justify-between gap-3 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${day.date === selectedDate ? "bg-muted" : ""}`}>
          <span className="min-w-0 truncate text-sm">{formatDay(day.date)}</span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(day.amount)}</span>
        </button>
      ))}
    </div>}
  </CardContent></Card>
}

function DailyStat({ label, value, hint, className }: { label: string; value: string; hint: string; className?: string }) { return <div className={`min-w-0 rounded-lg border bg-muted/40 p-3 ${className ?? ""}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold break-words tabular-nums">{value}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p></div> }
function formatDay(date: string) { return new Intl.DateTimeFormat("en-BD", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00.000Z`)) }

function Summary({ label, amount, change, icon: Icon, positive = false }: { label: string; amount: number; change?: number | null; icon: typeof WalletCards; positive?: boolean }) { return <Card><CardContent className="p-5"><div className={`grid size-9 place-items-center rounded-lg ${positive ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}`}><Icon className="size-4" /></div><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold break-words tabular-nums">{formatMoney(amount)}</p>{change !== undefined && change !== null && <p className={`mt-2 text-xs ${change <= 0 && label === "Expense" ? "text-success-foreground" : "text-muted-foreground"}`}>{Math.abs(change)}% {change >= 0 ? "higher" : "lower"} than last month</p>}</CardContent></Card> }
function FlowBar({ label, amount, max, className }: { label: string; amount: number; max: number; className: string }) { return <div className="min-w-0"><div className="mb-2 flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{label}</span><strong className="shrink-0 tabular-nums">{formatMoney(amount)}</strong></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(amount ? 4 : 0, amount / max * 100)}%` }} /></div></div> }
function Breakdown({ title, items, total, empty }: { title: string; items: Array<{ name: string; amount: number }>; total: number; empty: string }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <div className="grid min-w-0 gap-4">{items.map((item) => <div key={item.name} className="min-w-0"><div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{item.name}</span><strong className="shrink-0 tabular-nums">{formatMoney(item.amount)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total ? item.amount / total * 100 : 0}%` }} /></div></div>)}</div>}</CardContent></Card> }
function percentChange(current: number, previous: number) { if (!previous) return current ? 100 : null; return Math.round((current - previous) / previous * 100) }
function ReportsSkeleton() { return <div className="grid gap-6"><Skeleton className="h-20 w-full max-w-72" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-36" />)}</div><Skeleton className="h-64" /><Skeleton className="h-96" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div></div> }
