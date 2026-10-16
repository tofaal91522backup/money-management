"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function toMonthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` }
function shiftMonth(month: string, delta: number) { const [year, m] = month.split("-").map(Number); return toMonthKey(new Date(year, m - 1 + delta, 1)) }
function formatMonth(month: string) { const [year, m] = month.split("-").map(Number); return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) }

// Safari has no native <input type="month">, so step through months with buttons instead.
export function MonthPicker({ value, onChange, className }: { value: string; onChange: (month: string) => void; className?: string }) {
  return <div className={`flex min-w-0 items-center justify-between gap-1 rounded-lg border px-1 ${className ?? ""}`}><Button type="button" variant="ghost" size="icon-xs" aria-label="Previous month" onClick={() => onChange(shiftMonth(value, -1))}><ChevronLeft className="size-4" /></Button><button type="button" className="truncate px-1 text-sm font-medium" title="Jump to current month" onClick={() => onChange(toMonthKey(new Date()))}>{formatMonth(value)}</button><Button type="button" variant="ghost" size="icon-xs" aria-label="Next month" onClick={() => onChange(shiftMonth(value, 1))}><ChevronRight className="size-4" /></Button></div>
}
