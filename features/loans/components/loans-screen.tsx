"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleDollarSign, HandCoins, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { accountsQueryKey } from "@/features/accounts/api"
import { dashboardQueryKey } from "@/features/dashboard/types"
import { deleteLoanAction } from "@/features/loans/actions"
import { getLoans } from "@/features/loans/api"
import { LoanForm, RepaymentForm } from "@/features/loans/components/loan-forms"
import { loansQueryKey, type LoanSummary, type LoanType } from "@/features/loans/types"
import { formatMoney } from "@/lib/money/currency"
import { refreshAppData } from "@/lib/query/refresh-app-data"

export function LoansScreen() {
  const queryClient = useQueryClient()
  const [type, setType] = useState<LoanType>("RECEIVABLE")
  const [createOpen, setCreateOpen] = useState(false)
  const [repaying, setRepaying] = useState<LoanSummary | null>(null)
  const [editing, setEditing] = useState<LoanSummary | null>(null)
  const [deleting, setDeleting] = useState<LoanSummary | null>(null)
  const { data: loans = [], isPending, isError, refetch } = useQuery({ queryKey: loansQueryKey, queryFn: getLoans })
  const filtered = loans.filter((loan) => loan.type === type)
  const total = filtered.reduce((sum, loan) => sum + loan.remainingAmount, 0)

  async function deleteLoan(formData: FormData) {
    await deleteLoanAction(formData)
    await refreshAppData(queryClient)
    setDeleting(null)
  }

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Loans</h1><p className="mt-1 text-sm text-muted-foreground">Track money you will receive and money you need to repay.</p></div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="size-4" /> Add loan</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add loan</DialogTitle><DialogDescription>Loan activity changes account balance, not income or expense.</DialogDescription></DialogHeader><LoanForm onSuccess={() => setCreateOpen(false)} /></DialogContent></Dialog>
    </div>

    <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:flex sm:w-fit">
      <button onClick={() => setType("RECEIVABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "RECEIVABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I will receive</button>
      <button onClick={() => setType("PAYABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "PAYABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I need to repay</button>
    </div>

    <Card className={type === "RECEIVABLE" ? "bg-success" : "bg-warning"}><CardContent className="p-5"><p className="text-sm font-medium">{type === "RECEIVABLE" ? "Total receivable" : "Total payable"}</p><p className="mt-2 text-3xl font-semibold break-words tabular-nums">{formatMoney(total)}</p></CardContent></Card>
    {isPending && <p className="text-sm text-muted-foreground">Loading loans…</p>}
    {isError && <EmptyState icon={HandCoins} title="Could not load loans" description="Please try again." action={<Button onClick={() => refetch()}>Try again</Button>} />}
    {!isPending && !isError && filtered.length === 0 && <EmptyState icon={CircleDollarSign} title={type === "RECEIVABLE" ? "No money to receive" : "No money to repay"} description="Add a loan to keep it from being forgotten." action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Add loan</Button>} />}
    {!isPending && !isError && filtered.map((loan) => <LoanCard key={loan.id} loan={loan} onRepay={() => setRepaying(loan)} onEdit={() => setEditing(loan)} onDelete={() => setDeleting(loan)} />)}

    <Dialog open={Boolean(repaying)} onOpenChange={(open) => !open && setRepaying(null)}><DialogContent><DialogHeader><DialogTitle>Add repayment</DialogTitle><DialogDescription>Record partial or full repayment against this loan.</DialogDescription></DialogHeader>{repaying && <RepaymentForm loan={repaying} onSuccess={() => setRepaying(null)} />}</DialogContent></Dialog>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit loan</DialogTitle><DialogDescription>Update the loan details. Account balances will be adjusted automatically.</DialogDescription></DialogHeader>{editing && <LoanForm loan={editing} onSuccess={() => setEditing(null)} />}</DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Delete this loan?</DialogTitle><DialogDescription>This will permanently delete the loan and all of its repayments. Related account balances will be corrected automatically.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><form action={deleteLoan}><input type="hidden" name="loanId" value={deleting?.id ?? ""} /><Button type="submit" variant="destructive"><Trash2 className="size-4" /> Delete loan</Button></form></DialogFooter></DialogContent></Dialog>
  </div>
}

function LoanCard({ loan, onRepay, onEdit, onDelete }: { loan: LoanSummary; onRepay: () => void; onEdit: () => void; onDelete: () => void }) {
  const statusVariant = loan.status === "OVERDUE" ? "destructive" : loan.status === "PAID" ? "success" : "warning"

  return <Card><CardContent className="p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{loan.personName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{loan.originAccount.name}{loan.personContact ? ` · ${loan.personContact}` : ""}</p></div><Badge className="shrink-0" variant={statusVariant}>{loan.status.replaceAll("_", " ")}</Badge></div>
    <div className="mt-5 grid grid-cols-3 gap-3 text-sm"><div className="min-w-0"><p className="text-xs text-muted-foreground">Original</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.originalAmount)}</p></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Repaid</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.repaidAmount)}</p></div><div className="min-w-0"><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.remainingAmount)}</p></div></div>
    {loan.dueDate && <p className="mt-4 text-xs text-muted-foreground">Due {new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(loan.dueDate))}</p>}
    <div className="mt-4 flex flex-wrap gap-2">{loan.remainingAmount > 0 && <Button variant="outline" size="sm" onClick={onRepay}>Add repayment</Button>}<Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="size-3.5" /> Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-3.5" /> Delete</Button></div>
    {loan.repayments.length > 0 && <p className="mt-4 text-xs break-words text-muted-foreground">Latest repayment: {formatMoney(loan.repayments[0].amount)} via {loan.repayments[0].account.name}</p>}
  </CardContent></Card>
}
