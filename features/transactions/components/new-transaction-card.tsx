"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { TransferForm } from "@/features/transactions/components/transfer-form"

type Tab = "EXPENSE" | "INCOME" | "TRANSFER"

const tabs = [
  { value: "EXPENSE", label: "Expense", icon: ArrowUpRight, tone: "text-destructive", description: "Record money you spent." },
  { value: "INCOME", label: "Income", icon: ArrowDownLeft, tone: "text-primary", description: "Record money you received." },
  { value: "TRANSFER", label: "Move money", icon: ArrowRightLeft, tone: "", description: "Transfer between your own accounts without changing total money." },
] as const

export function NewTransactionCard() {
  const [tab, setTab] = useState<Tab>("EXPENSE")
  const active = tabs.find((item) => item.value === tab)!

  return <Card className="mx-auto w-full min-w-0 max-w-xl">
    <CardHeader><CardTitle>New transaction</CardTitle><CardDescription>{active.description}</CardDescription></CardHeader>
    <CardContent className="grid gap-5">
      <div role="tablist" className="grid grid-cols-3 rounded-lg bg-muted p-1">
        {tabs.map(({ value, label, icon: Icon, tone }) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors ${tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}><Icon className={`size-4 shrink-0 ${tone}`} /><span className="truncate">{label}</span></button>)}
      </div>
      {tab === "TRANSFER" ? <TransferForm key="transfer" /> : <TransactionForm key={tab} lockedType={tab} />}
    </CardContent>
  </Card>
}
