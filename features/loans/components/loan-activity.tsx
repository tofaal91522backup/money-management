"use client"

import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import type { LoanSummary, LoanType } from "@/features/loans/types"
import { formatMoney } from "@/lib/money/currency"

type Filter = "ALL" | "LOAN" | "REPAYMENT"
type Event = { id: string; kind: "LOAN" | "REPAYMENT"; person: string; date: string; amount: number; account: string; note: string | null; label: string; moneyIn: boolean }

const PREVIEW = 6
const formatDate = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
const filters: Array<{ value: Filter; label: string }> = [{ value: "ALL", label: "All" }, { value: "LOAN", label: "Loans" }, { value: "REPAYMENT", label: "Repayments" }]

function buildEvents(loans: LoanSummary[], type: LoanType): Event[] {
  const receivable = type === "RECEIVABLE"
  return loans.flatMap((loan) => {
    const person = loan.person?.name ?? loan.personName
    const given: Event = { id: `loan-${loan.id}`, kind: "LOAN", person, date: loan.startDate, amount: loan.originalAmount, account: loan.originAccount.name, note: loan.note, label: loan.isOpeningLoan ? "Old loan" : receivable ? "You lent" : "You borrowed", moneyIn: !receivable }
    const repayments: Event[] = loan.repayments.map((repayment) => ({ id: `repayment-${repayment.id}`, kind: "REPAYMENT", person, date: repayment.date, amount: repayment.amount, account: repayment.account.name, note: repayment.note, label: receivable ? "Collected" : "You repaid", moneyIn: receivable }))
    return [given, ...repayments]
  }).sort((a, b) => b.date.localeCompare(a.date))
}

export function LoanActivity({ loans, type }: { loans: LoanSummary[]; type: LoanType }) {
  const [filter, setFilter] = useState<Filter>("ALL")
  const [showAll, setShowAll] = useState(false)
  const events = buildEvents(loans, type).filter((event) => filter === "ALL" || event.kind === filter)
  const visible = showAll ? events : events.slice(0, PREVIEW)
  if (loans.length === 0) return null

  return <Card><CardContent className="p-4 sm:p-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0"><p className="font-semibold">Transactions</p><p className="mt-1 text-sm text-muted-foreground">Every loan and repayment, newest first.</p></div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">{filters.map((item) => <button key={item.value} type="button" role="tab" aria-selected={filter === item.value} onClick={() => { setFilter(item.value); setShowAll(false) }} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${filter === item.value ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>
    </div>
    {events.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">Nothing recorded yet.</p> : <ul className="mt-4 grid divide-y">
      {visible.map((event) => <li key={event.id} className="flex min-w-0 items-center gap-3 py-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${event.moneyIn ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive"}`}>{event.moneyIn ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{event.person} <span className="font-normal text-muted-foreground">· {event.label}</span></p><p className="mt-0.5 truncate text-xs text-muted-foreground">{formatDate(event.date)} · {event.account}{event.note ? ` · ${event.note}` : ""}</p></div>
        <p className={`shrink-0 text-sm font-semibold tabular-nums ${event.moneyIn ? "text-success-foreground" : "text-destructive"}`}>{event.moneyIn ? "+" : "−"}{formatMoney(event.amount)}</p>
      </li>)}
    </ul>}
    {events.length > PREVIEW && <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-primary hover:bg-muted">{showAll ? "Show less" : `Show all ${events.length}`}</button>}
  </CardContent></Card>
}
