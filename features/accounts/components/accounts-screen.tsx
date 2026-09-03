"use client"

import { Archive, Building2, CircleDollarSign, Landmark, Pencil, Plus, WalletCards } from "lucide-react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getAccounts, accountsQueryKey } from "@/features/accounts/api"
import { toggleAccountArchiveAction } from "@/features/accounts/actions"
import { AccountForm } from "@/features/accounts/components/account-form"
import { accountTypeLabels, type AccountSummary, type AccountType } from "@/features/accounts/types"
import { formatMoney } from "@/lib/money/currency"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const accountIcons: Record<AccountType, typeof WalletCards> = {
  CASH: CircleDollarSign,
  BANK: Landmark,
  MOBILE_WALLET: WalletCards,
  SAVINGS: Building2,
  OTHER: WalletCards,
}

export function AccountsScreen() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountSummary | null>(null)
  const { data: accounts = [], isPending, isError, refetch } = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })
  const activeAccounts = accounts.filter((account) => !account.isArchived)
  const archivedAccounts = accounts.filter((account) => account.isArchived)
  const totalBalance = activeAccounts.reduce((total, account) => total + account.balance, 0)
  const toggleArchive = async (formData: FormData) => { await toggleAccountArchiveAction(formData); await refreshAppData(queryClient) }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep cash, bank, and mobile wallet money separate and visible.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> Add account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add an account</DialogTitle><DialogDescription>Start with the balance currently in this account.</DialogDescription></DialogHeader>
            <AccountForm onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden bg-primary text-primary-foreground">
        <CardContent className="p-5 sm:p-6">
          <p className="text-sm font-medium text-primary-foreground/75">Total available balance</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{formatMoney(totalBalance)}</p>
          <p className="mt-2 text-sm text-primary-foreground/75">Across {activeAccounts.length} active {activeAccounts.length === 1 ? "account" : "accounts"}</p>
        </CardContent>
      </Card>

      {isPending && <AccountsSkeleton />}
      {isError && <EmptyState icon={WalletCards} title="Could not load accounts" description="Your accounts are still safe. Please try again." action={<Button onClick={() => refetch()}>Try again</Button>} />}
      {!isPending && !isError && activeAccounts.length === 0 && <EmptyState icon={WalletCards} title="Add your first account" description="Create Cash, Bank, or Mobile Wallet accounts to start tracking where your money is." action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Add account</Button>} />}
      {!isPending && !isError && activeAccounts.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeAccounts.map((account) => <AccountCard key={account.id} account={account} onEdit={() => setEditingAccount(account)} onToggleArchive={toggleArchive} />)}
        </section>
      )}
      {!isPending && !isError && archivedAccounts.length > 0 && (
        <section className="grid gap-3">
          <div><h2 className="text-sm font-semibold">Archived accounts</h2><p className="mt-1 text-sm text-muted-foreground">These accounts remain in history but are hidden from new transactions.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{archivedAccounts.map((account) => <AccountCard key={account.id} account={account} onEdit={() => setEditingAccount(account)} onToggleArchive={toggleArchive} />)}</div>
        </section>
      )}
      <Dialog open={Boolean(editingAccount)} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit account</DialogTitle><DialogDescription>Changes here only affect this account’s details.</DialogDescription></DialogHeader>
          {editingAccount && <AccountForm account={editingAccount} onSuccess={() => setEditingAccount(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AccountCard({ account, onEdit, onToggleArchive }: { account: AccountSummary; onEdit: () => void; onToggleArchive: (formData: FormData) => Promise<void> }) {
  const Icon = accountIcons[account.type]

  return (
    <Card className={account.isArchived ? "opacity-70" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{accountTypeLabels[account.type]}</p></div></div>
          {account.isArchived && <Badge variant="secondary">Archived</Badge>}
        </div>
        <p className="mt-6 text-2xl font-semibold tracking-tight">{formatMoney(account.balance)}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{account.identifier ?? "No account note added"}</p>
        <div className="mt-5 flex items-center gap-2 border-t pt-4"><Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="size-3.5" /> Edit</Button><form action={onToggleArchive}><input type="hidden" name="accountId" value={account.id} /><input type="hidden" name="archive" value={String(!account.isArchived)} /><Button variant="ghost" size="sm" type="submit"><Archive className="size-3.5" /> {account.isArchived ? "Restore" : "Archive"}</Button></form></div>
      </CardContent>
    </Card>
  )
}

function AccountsSkeleton() {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Card key={index}><CardContent className="p-5"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="mt-6 h-7 w-32" /><Skeleton className="mt-2 h-4 w-20" /></CardContent></Card>)}</div>
}
