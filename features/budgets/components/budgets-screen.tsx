"use client"

import { useActionState, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from "@/features/budgets/actions"
import { getBudgets } from "@/features/budgets/api"
import { budgetsQueryKey, type BudgetFormState, type BudgetSummary } from "@/features/budgets/types"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import { formatMoney } from "@/lib/money/currency"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: BudgetFormState = {}
const currentMonth = new Date().toISOString().slice(0, 7)

export function BudgetsScreen() {
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(currentMonth)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetSummary | null>(null)
  const query = useQuery({ queryKey: [...budgetsQueryKey, month], queryFn: () => getBudgets(month) })
  const deleteBudget = async (formData: FormData) => { await deleteBudgetAction(formData); await refreshAppData(queryClient) }

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Budgets</h1><p className="mt-1 text-sm text-muted-foreground">Set monthly limits before spending gets away from you.</p></div><div className="flex gap-2"><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><Plus className="size-4" /> Add budget</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add budget</DialogTitle><DialogDescription>Set a total monthly limit or a limit for one expense category.</DialogDescription></DialogHeader><BudgetForm month={month} onSuccess={() => setCreateOpen(false)} /></DialogContent></Dialog></div></div>
    {query.isPending && <p className="text-sm text-muted-foreground">Loading budgets…</p>}
    {query.isError && <EmptyState title="Could not load budgets" description="Please try again." action={<Button onClick={() => query.refetch()}>Try again</Button>} />}
    {!query.isPending && !query.data?.length && <EmptyState title="No budgets for this month" description="Create a monthly limit for all spending or one category." action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Add budget</Button>} />}
    {query.data?.map((budget) => <BudgetCard key={budget.id} budget={budget} onEdit={() => setEditing(budget)} onDelete={deleteBudget} />)}
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit budget</DialogTitle><DialogDescription>Changes update this month’s spending progress right away.</DialogDescription></DialogHeader>{editing && <BudgetForm budget={editing} month={month} onSuccess={() => setEditing(null)} />}</DialogContent></Dialog>
  </div>
}

function BudgetForm({ budget, month, onSuccess }: { budget?: BudgetSummary; month: string; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState(budget?.scope ?? "CATEGORY")
  const [state, formAction, pending] = useActionState(budget ? updateBudgetAction : createBudgetAction, initialState)
  const categories = (useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories }).data ?? []).filter((category) => category.type === "EXPENSE" && !category.isArchived)
  useEffect(() => { if (state.success) { void refreshAppData(queryClient); onSuccess() } }, [onSuccess, queryClient, state])

  return <form action={formAction} className="grid gap-4">
    {budget && <input type="hidden" name="budgetId" value={budget.id} />}<input type="hidden" name="month" value={month} />
    <div className="grid grid-cols-2 rounded-lg bg-muted p-1"><button type="button" onClick={() => setScope("CATEGORY")} className={`rounded-md px-3 py-2 text-sm font-medium ${scope === "CATEGORY" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Category</button><button type="button" onClick={() => setScope("TOTAL")} className={`rounded-md px-3 py-2 text-sm font-medium ${scope === "TOTAL" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Total</button></div>
    <input type="hidden" name="scope" value={scope} />
    {scope === "CATEGORY" && <label className="grid gap-2 text-sm font-medium">Expense category<select name="categoryId" defaultValue={budget?.category?.id ?? ""} className="h-10 rounded-lg border bg-background px-3 text-sm" required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
    <label className="grid gap-2 text-sm font-medium">Monthly limit<Input name="amount" type="text" inputMode="decimal" defaultValue={budget ? String(budget.amount / 100) : ""} placeholder="0.00" required /></label>
    {state.error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : budget ? "Save budget" : "Create budget"}</Button>
  </form>
}

function BudgetCard({ budget, onEdit, onDelete }: { budget: BudgetSummary; onEdit: () => void; onDelete: (formData: FormData) => Promise<void> }) {
  const percent = Math.round(budget.progress * 100)
  const tone = percent >= 100 ? "bg-destructive" : percent >= 80 ? "bg-warning-foreground" : "bg-primary"
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{budget.scope === "TOTAL" ? "Total monthly budget" : budget.category?.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatMoney(budget.spent)} of {formatMoney(budget.amount)}</p></div><div className="flex"><Button variant="ghost" size="icon-xs" onClick={onEdit}><Pencil className="size-3.5" /></Button><form action={onDelete}><input type="hidden" name="budgetId" value={budget.id} /><Button variant="ghost" size="icon-xs" type="submit"><Trash2 className="size-3.5 text-destructive" /></Button></form></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className={`${tone} h-full rounded-full`} style={{ width: `${Math.min(percent, 100)}%` }} /></div><p className={`mt-2 text-xs font-medium ${percent >= 100 ? "text-destructive" : percent >= 80 ? "text-warning-foreground" : "text-muted-foreground"}`}>{percent >= 100 ? `${percent}% — over budget` : percent >= 80 ? `${percent}% — close to limit` : `${percent}% used`}</p></CardContent></Card>
}
