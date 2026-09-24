import { AlertTriangle, CalendarClock, ListChecks, Users } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { LoanSummary, LoanType } from "@/features/loans/types"
import { formatMoney } from "@/lib/money/currency"
import { cn } from "@/lib/utils"

const formatDate = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
const percentOf = (part: number, whole: number) => (whole > 0 ? Math.min(Math.round((part / whole) * 100), 100) : 0)

// Each tab keeps one hue: green for money coming back, amber for money going out.
const barTone = (type: LoanType) => (type === "RECEIVABLE" ? "bg-chart-1" : "bg-chart-3")

export function LoanProgress({ repaid, original, type, className }: { repaid: number; original: number; type: LoanType; className?: string }) {
  const percent = percentOf(repaid, original)
  return <div className={cn("grid gap-1.5", className)}>
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={type === "RECEIVABLE" ? "Collected" : "Repaid"}>
      <div className={cn("h-full rounded-full transition-[width]", barTone(type))} style={{ width: `${percent}%` }} />
    </div>
    <p className="text-xs text-muted-foreground tabular-nums">{percent}% {type === "RECEIVABLE" ? "collected" : "repaid"}</p>
  </div>
}

export function LoanOverview({ loans, type, peopleCount }: { loans: LoanSummary[]; type: LoanType; peopleCount: number }) {
  const original = loans.reduce((sum, loan) => sum + loan.originalAmount, 0)
  const repaid = loans.reduce((sum, loan) => sum + loan.repaidAmount, 0)
  const remaining = original - repaid
  const open = loans.filter((loan) => loan.remainingAmount > 0)
  const overdue = open.filter((loan) => loan.status === "OVERDUE")
  const overdueAmount = overdue.reduce((sum, loan) => sum + loan.remainingAmount, 0)
  const nextDue = open.filter((loan) => loan.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0]
  const receivable = type === "RECEIVABLE"

  return <div className="grid gap-3">
    <Card className={receivable ? "bg-success" : "bg-warning"}><CardContent className="p-5">
      <p className="text-sm font-medium">{receivable ? "Total receivable" : "Total payable"}</p>
      <p className="mt-2 text-3xl font-semibold break-words tabular-nums">{formatMoney(remaining)}</p>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background/70">
        <div className={cn("h-full rounded-full", barTone(type))} style={{ width: `${percentOf(repaid, original)}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
        <span className="tabular-nums">{formatMoney(repaid)} {receivable ? "collected" : "repaid"} · {percentOf(repaid, original)}%</span>
        <span className="tabular-nums opacity-75">of {formatMoney(original)} total</span>
      </div>
    </CardContent></Card>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={ListChecks} label="Open entries" value={String(open.length)} hint={`${loans.length - open.length} fully ${receivable ? "collected" : "repaid"}`} />
      <StatTile icon={Users} label="People" value={String(peopleCount)} hint={receivable ? "Owe you money" : "You owe money to"} />
      <StatTile icon={AlertTriangle} label="Overdue" value={String(overdue.length)} hint={overdue.length ? formatMoney(overdueAmount) : "Nothing late"} alert={overdue.length > 0} />
      <StatTile icon={CalendarClock} label="Next due" value={nextDue ? formatDate(nextDue.dueDate!) : "—"} hint={nextDue ? `${nextDue.person?.name ?? nextDue.personName} · ${formatMoney(nextDue.remainingAmount)}` : "No due dates set"} alert={nextDue?.status === "OVERDUE"} />
    </div>
  </div>
}

function StatTile({ icon: Icon, label, value, hint, alert }: { icon: typeof Users; label: string; value: string; hint: string; alert?: boolean }) {
  return <Card><CardContent className="p-4">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon className={cn("size-3.5 shrink-0", alert && "text-destructive")} /><span className="truncate">{label}</span></div>
    <p className={cn("mt-2 truncate text-lg font-semibold tabular-nums", alert && "text-destructive")}>{value}</p>
    <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
  </CardContent></Card>
}

const MAX_ROWS = 6

// Remaining balance per person, largest first; anyone past the sixth row folds into "Others".
export function LoanPeopleChart({ rows, type }: { rows: Array<{ id: string; name: string; remaining: number }>; type: LoanType }) {
  const owing = rows.filter((row) => row.remaining > 0).sort((a, b) => b.remaining - a.remaining)
  if (owing.length === 0) return null

  const total = owing.reduce((sum, row) => sum + row.remaining, 0)
  const shown = owing.length > MAX_ROWS ? owing.slice(0, MAX_ROWS - 1) : owing
  const rest = owing.slice(shown.length)
  const bars = rest.length ? [...shown, { id: "others", name: `Others (${rest.length})`, remaining: rest.reduce((sum, row) => sum + row.remaining, 0) }] : shown
  const max = Math.max(...bars.map((bar) => bar.remaining))

  return <Card><CardContent className="p-5">
    <p className="font-semibold">{type === "RECEIVABLE" ? "Who owes you the most" : "Who you owe the most"}</p>
    <p className="mt-1 text-sm text-muted-foreground">Remaining balance by person.</p>
    <ul className="mt-5 grid gap-3">
      {bars.map((bar) => <li key={bar.id} className="grid gap-1.5" title={`${bar.name}: ${formatMoney(bar.remaining)} (${percentOf(bar.remaining, total)}% of total)`}>
        <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
          <span className="min-w-0 truncate">{bar.name}</span>
          <span className="shrink-0 tabular-nums"><strong className="font-semibold">{formatMoney(bar.remaining)}</strong> <span className="text-xs text-muted-foreground">{percentOf(bar.remaining, total)}%</span></span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div className={cn("h-full min-w-2 rounded-full", barTone(type))} style={{ width: `${(bar.remaining / max) * 100}%` }} />
        </div>
      </li>)}
    </ul>
  </CardContent></Card>
}
