"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, CircleDollarSign, HandCoins, Pencil, Plus, Trash2, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { deleteLoanAction } from "@/features/loans/actions"
import { getLoanPeople, getLoans } from "@/features/loans/api"
import { DeletePersonForm, LoanForm, PersonForm, RepaymentForm } from "@/features/loans/components/loan-forms"
import { loanPeopleQueryKey, loansQueryKey, type LoanPersonSummary, type LoanSummary, type LoanType } from "@/features/loans/types"
import { formatMoney } from "@/lib/money/currency"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const formatDate = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

type PersonGroup = { person: LoanPersonSummary; entries: LoanSummary[]; remaining: number }

export function LoansScreen() {
  const queryClient = useQueryClient()
  const [type, setType] = useState<LoanType>("RECEIVABLE")
  const [openPeople, setOpenPeople] = useState<string[]>([])
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [editingPerson, setEditingPerson] = useState<LoanPersonSummary | null>(null)
  const [deletingPerson, setDeletingPerson] = useState<LoanPersonSummary | null>(null)
  const [loanFor, setLoanFor] = useState<{ personId?: string } | null>(null)
  const [editing, setEditing] = useState<LoanSummary | null>(null)
  const [repaying, setRepaying] = useState<LoanSummary | null>(null)
  const [deleting, setDeleting] = useState<LoanSummary | null>(null)

  const { data: loans = [], isPending, isError, refetch } = useQuery({ queryKey: loansQueryKey, queryFn: getLoans })
  const { data: people = [] } = useQuery({ queryKey: loanPeopleQueryKey, queryFn: getLoanPeople })

  const entriesOfType = loans.filter((loan) => loan.type === type)
  const total = entriesOfType.reduce((sum, loan) => sum + loan.remainingAmount, 0)

  // A person shows in a tab when they have an entry of that kind, and a brand
  // new person shows in both tabs so the first loan can be added from either.
  const groups: PersonGroup[] = people
    .map((person) => {
      const entries = entriesOfType.filter((loan) => (loan.person ? loan.person.id === person.id : loan.personName.trim().toLowerCase() === person.name.trim().toLowerCase()))
      return { person, entries, remaining: entries.reduce((sum, entry) => sum + entry.remainingAmount, 0) }
    })
    .filter((group) => group.entries.length > 0 || group.person.loanCount === 0)
    .sort((a, b) => b.remaining - a.remaining || a.person.name.localeCompare(b.person.name))

  const togglePerson = (id: string) => setOpenPeople((open) => (open.includes(id) ? open.filter((value) => value !== id) : [...open, id]))

  async function deleteLoan(formData: FormData) {
    await deleteLoanAction(formData)
    await refreshAppData(queryClient)
    setDeleting(null)
  }

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Loans</h1><p className="mt-1 text-sm text-muted-foreground">Track money you will receive and money you need to repay.</p></div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCreatingPerson(true)}><UserPlus className="size-4" /> Add person</Button>
        <Button className="w-full sm:w-auto" onClick={() => setLoanFor({})}><Plus className="size-4" /> Add loan</Button>
      </div>
    </div>

    <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:flex sm:w-fit">
      <button onClick={() => setType("RECEIVABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "RECEIVABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I will receive</button>
      <button onClick={() => setType("PAYABLE")} className={`min-w-0 truncate rounded-md px-3 py-2 text-sm font-medium ${type === "PAYABLE" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>I need to repay</button>
    </div>

    <Card className={type === "RECEIVABLE" ? "bg-success" : "bg-warning"}><CardContent className="p-5"><p className="text-sm font-medium">{type === "RECEIVABLE" ? "Total receivable" : "Total payable"}</p><p className="mt-2 text-3xl font-semibold break-words tabular-nums">{formatMoney(total)}</p></CardContent></Card>

    {isPending && <p className="text-sm text-muted-foreground">Loading loans…</p>}
    {isError && <EmptyState icon={HandCoins} title="Could not load loans" description="Please try again." action={<Button onClick={() => refetch()}>Try again</Button>} />}
    {!isPending && !isError && groups.length === 0 && <EmptyState icon={CircleDollarSign} title={type === "RECEIVABLE" ? "No money to receive" : "No money to repay"} description="Add a person first, then keep every loan for them in one place." action={<Button onClick={() => setCreatingPerson(true)}><UserPlus className="size-4" /> Add person</Button>} />}

    {!isPending && !isError && groups.map((group) => <PersonCard
      key={group.person.id}
      group={group}
      type={type}
      open={openPeople.includes(group.person.id)}
      onToggle={() => togglePerson(group.person.id)}
      onAddLoan={() => setLoanFor({ personId: group.person.id })}
      onEditPerson={() => setEditingPerson(group.person)}
      onDeletePerson={() => setDeletingPerson(group.person)}
      onRepay={setRepaying}
      onEdit={setEditing}
      onDelete={setDeleting}
    />)}

    <Dialog open={creatingPerson} onOpenChange={setCreatingPerson}><DialogContent><DialogHeader><DialogTitle>Add person</DialogTitle><DialogDescription>Create the person once, then add as many loan entries for them as you need.</DialogDescription></DialogHeader><PersonForm onSuccess={() => setCreatingPerson(false)} /></DialogContent></Dialog>
    <Dialog open={Boolean(editingPerson)} onOpenChange={(open) => !open && setEditingPerson(null)}><DialogContent><DialogHeader><DialogTitle>Edit person</DialogTitle><DialogDescription>Renaming updates every loan entry saved under this person.</DialogDescription></DialogHeader>{editingPerson && <PersonForm person={editingPerson} onSuccess={() => setEditingPerson(null)} />}</DialogContent></Dialog>
    <Dialog open={Boolean(deletingPerson)} onOpenChange={(open) => !open && setDeletingPerson(null)}><DialogContent><DialogHeader><DialogTitle>Delete {deletingPerson?.name}?</DialogTitle><DialogDescription>A person can only be removed once all of their loan entries are gone. No balance changes either way.</DialogDescription></DialogHeader>{deletingPerson && <DeletePersonForm person={deletingPerson} onCancel={() => setDeletingPerson(null)} onSuccess={() => setDeletingPerson(null)} />}</DialogContent></Dialog>

    <Dialog open={Boolean(loanFor)} onOpenChange={(open) => !open && setLoanFor(null)}><DialogContent><DialogHeader><DialogTitle>Add loan</DialogTitle><DialogDescription>Loan activity changes account balance, not income or expense.</DialogDescription></DialogHeader>{loanFor && <LoanForm personId={loanFor.personId} onSuccess={() => setLoanFor(null)} />}</DialogContent></Dialog>
    <Dialog open={Boolean(repaying)} onOpenChange={(open) => !open && setRepaying(null)}><DialogContent><DialogHeader><DialogTitle>Add repayment</DialogTitle><DialogDescription>Record partial or full repayment against this loan.</DialogDescription></DialogHeader>{repaying && <RepaymentForm loan={repaying} onSuccess={() => setRepaying(null)} />}</DialogContent></Dialog>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit loan</DialogTitle><DialogDescription>Account balances only change if you ask for it.</DialogDescription></DialogHeader>{editing && <LoanForm loan={editing} onSuccess={() => setEditing(null)} />}</DialogContent></Dialog>
    {deleting && <DeleteLoanDialog loan={deleting} onCancel={() => setDeleting(null)} onConfirm={deleteLoan} />}
  </div>
}

function PersonCard({ group, type, open, onToggle, onAddLoan, onEditPerson, onDeletePerson, onRepay, onEdit, onDelete }: {
  group: PersonGroup
  type: LoanType
  open: boolean
  onToggle: () => void
  onAddLoan: () => void
  onEditPerson: () => void
  onDeletePerson: () => void
  onRepay: (loan: LoanSummary) => void
  onEdit: (loan: LoanSummary) => void
  onDelete: (loan: LoanSummary) => void
}) {
  const { person, entries, remaining } = group
  const overdue = entries.some((entry) => entry.status === "OVERDUE")

  return <Card><CardContent className="p-0">
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start justify-between gap-3 p-5 text-left">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{person.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{entries.length === 0 ? "No entries yet" : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}{person.contact ? ` · ${person.contact}` : ""}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right"><p className="text-xs text-muted-foreground">{type === "RECEIVABLE" ? "To receive" : "To repay"}</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(remaining)}</p></div>
        {overdue && <Badge variant="destructive">OVERDUE</Badge>}
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
    </button>

    {open && <div className="grid gap-3 border-t p-5">
      {person.note && <p className="text-xs break-words text-muted-foreground">{person.note}</p>}
      {entries.length === 0 && <p className="text-sm text-muted-foreground">Nothing here yet. Add the first entry for {person.name}.</p>}
      {entries.map((entry) => <LoanEntry key={entry.id} loan={entry} onRepay={() => onRepay(entry)} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} />)}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onAddLoan}><Plus className="size-3.5" /> Add loan</Button>
        <Button variant="ghost" size="sm" onClick={onEditPerson}><Pencil className="size-3.5" /> Edit person</Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDeletePerson}><Trash2 className="size-3.5" /> Delete person</Button>
      </div>
    </div>}
  </CardContent></Card>
}

function LoanEntry({ loan, onRepay, onEdit, onDelete }: { loan: LoanSummary; onRepay: () => void; onEdit: () => void; onDelete: () => void }) {
  const [showHistory, setShowHistory] = useState(false)
  const statusVariant = loan.status === "OVERDUE" ? "destructive" : loan.status === "PAID" ? "success" : "warning"

  return <div className="rounded-xl border bg-muted/20 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{formatDate(loan.startDate)}{loan.isOpeningLoan ? " · old loan" : ""}</p><p className="mt-1 truncate text-xs text-muted-foreground">{loan.originAccount.name}{loan.note ? ` · ${loan.note}` : ""}</p></div>
      <Badge className="shrink-0" variant={statusVariant}>{loan.status.replaceAll("_", " ")}</Badge>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Original</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.originalAmount)}</p></div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Repaid</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.repaidAmount)}</p></div>
      <div className="min-w-0"><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 font-semibold break-words tabular-nums">{formatMoney(loan.remainingAmount)}</p></div>
    </div>
    {loan.dueDate && <p className="mt-3 text-xs text-muted-foreground">Due {formatDate(loan.dueDate)}</p>}

    <div className="mt-4 flex flex-wrap gap-2">
      {loan.remainingAmount > 0 && <Button variant="outline" size="sm" onClick={onRepay}>Add repayment</Button>}
      <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="size-3.5" /> Edit</Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-3.5" /> Delete</Button>
      {loan.repayments.length > 0 && <Button variant="ghost" size="sm" onClick={() => setShowHistory((value) => !value)} aria-expanded={showHistory}>History ({loan.repayments.length}) <ChevronDown className={`size-3.5 transition-transform ${showHistory ? "rotate-180" : ""}`} /></Button>}
    </div>

    {showHistory && loan.repayments.length > 0 && <ul className="mt-3 grid gap-2 border-t pt-3">
      {loan.repayments.map((repayment) => <li key={repayment.id} className="flex items-start justify-between gap-3 text-xs">
        <span className="min-w-0"><span className="block font-medium">{formatDate(repayment.date)}</span><span className="block break-words text-muted-foreground">{repayment.account.name}{repayment.note ? ` · ${repayment.note}` : ""}</span></span>
        <strong className="shrink-0 tabular-nums">{formatMoney(repayment.amount)}</strong>
      </li>)}
    </ul>}
  </div>
}

// What deleting the loan does to each account, worked out from the movements
// the loan recorded: the disbursement and every repayment are reversed.
function deleteEffects(loan: LoanSummary) {
  const effects = new Map<string, number>()
  const add = (account: string, delta: number) => effects.set(account, (effects.get(account) ?? 0) + delta)
  if (!loan.isOpeningLoan) add(loan.originAccount.name, loan.type === "RECEIVABLE" ? loan.originalAmount : -loan.originalAmount)
  for (const repayment of loan.repayments) add(repayment.account.name, loan.type === "RECEIVABLE" ? -repayment.amount : repayment.amount)
  return [...effects.entries()].filter(([, delta]) => delta !== 0)
}

function DeleteLoanDialog({ loan, onCancel, onConfirm }: { loan: LoanSummary; onCancel: () => void; onConfirm: (formData: FormData) => Promise<void> }) {
  const [adjustBalance, setAdjustBalance] = useState(false)
  const effects = deleteEffects(loan)

  return <Dialog open onOpenChange={(open) => !open && onCancel()}><DialogContent>
    <DialogHeader><DialogTitle>Delete this loan?</DialogTitle><DialogDescription>The loan entry and its {loan.repayments.length} repayment {loan.repayments.length === 1 ? "record" : "records"} are removed for good.</DialogDescription></DialogHeader>
    <form action={onConfirm} className="grid gap-4">
      <input type="hidden" name="loanId" value={loan.id} />
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input name="adjustBalance" type="checkbox" checked={adjustBalance} onChange={(event) => setAdjustBalance(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
        <span className="min-w-0">
          <strong className="font-medium">Also update the account balance</strong>
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{adjustBalance ? "The money this loan moved is taken back out of the ledger." : "The money this loan moved stays recorded, so balances do not change. It will no longer be listed anywhere."}</span>
        </span>
      </label>

      {adjustBalance && effects.length > 0 && <div className="grid gap-1.5 rounded-lg border border-warning-foreground/20 bg-warning p-3 text-sm">
        <p className="text-xs font-medium">Balances will change:</p>
        {effects.map(([account, delta]) => <div key={account} className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{account}</span><strong className="shrink-0 tabular-nums">{delta > 0 ? "+" : "−"}{formatMoney(Math.abs(delta))}</strong></div>)}
      </div>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="destructive"><Trash2 className="size-4" /> Delete loan</Button>
      </DialogFooter>
    </form>
  </DialogContent></Dialog>
}
