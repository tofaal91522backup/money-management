"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownUp, CircleUserRound, Download, Palette, SlidersHorizontal, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { importDataAction, resetAllDataAction, updateSettingsAction } from "@/features/settings/actions"
import { getSettings } from "@/features/settings/api"
import { exportDataPath, settingsQueryKey, type ImportDataFormState, type ResetDataFormState, type SettingsFormState, type ThemePreference } from "@/features/settings/types"
import { dashboardQueryKey } from "@/features/dashboard/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: SettingsFormState = {}

export function SettingsScreen() {
  const settingsQuery = useQuery({ queryKey: settingsQueryKey, queryFn: getSettings })
  const accountsQuery = useQuery({ queryKey: accountsQueryKey, queryFn: getAccounts })

  if (settingsQuery.isPending || accountsQuery.isPending) return <SettingsSkeleton />
  if (settingsQuery.isError || accountsQuery.isError || !settingsQuery.data) return <EmptyState title="Could not load settings" description="Please try again." action={<Button onClick={() => { void settingsQuery.refetch(); void accountsQuery.refetch() }}>Try again</Button>} />

  return <SettingsForm settings={settingsQuery.data} accounts={accountsQuery.data ?? []} />
}

function SettingsForm({ settings, accounts }: { settings: Awaited<ReturnType<typeof getSettings>>; accounts: Awaited<ReturnType<typeof getAccounts>> }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setTheme } = useTheme()
  const [theme, setThemeValue] = useState<ThemePreference>(settings.theme)
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState)

  useEffect(() => {
    if (state.success && state.savedTheme) {
      setTheme(state.savedTheme.toLowerCase())
      void refreshAppData(queryClient)
      router.refresh()
    }
  }, [queryClient, router, setTheme, state])

  return <div className="grid gap-6"><form action={formAction} className="grid gap-6">
    <div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Personalize how your financial workspace behaves.</p></div>
    <Card><CardHeader><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CircleUserRound className="size-4" /></span><div className="min-w-0"><CardTitle>Profile</CardTitle><CardDescription>Your login email cannot be changed here.</CardDescription></div></div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Display name<Input name="name" defaultValue={settings.name ?? ""} placeholder="Your name" maxLength={60} /></label><label className="grid min-w-0 gap-2 text-sm font-medium">Email<Input value={settings.email} disabled /></label></CardContent></Card>
    <Card><CardHeader><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Palette className="size-4" /></span><div className="min-w-0"><CardTitle>Appearance</CardTitle><CardDescription>Choose a comfortable color theme.</CardDescription></div></div></CardHeader><CardContent><div className="grid grid-cols-3 gap-2">{(["LIGHT", "DARK", "SYSTEM"] as const).map((value) => <button key={value} type="button" onClick={() => setThemeValue(value)} className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${theme === value ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</button>)}</div><input type="hidden" name="theme" value={theme} /></CardContent></Card>
    <Card><CardHeader><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><SlidersHorizontal className="size-4" /></span><div className="min-w-0"><CardTitle>Money preferences</CardTitle><CardDescription>Defaults used throughout the app.</CardDescription></div></div></CardHeader><CardContent className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid min-w-0 gap-2 text-sm font-medium">Currency<Input value="Bangladeshi Taka (BDT)" disabled /></label><label className="grid min-w-0 gap-2 text-sm font-medium">Default account<select name="defaultAccountId" defaultValue={settings.defaultAccountId ?? ""} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm"><option value="">No default account</option>{accounts.filter((account) => !account.isArchived).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div><label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" name="hideBalances" defaultChecked={settings.hideBalances} className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" /><span className="min-w-0"><strong className="font-medium">Hide balances by default</strong><span className="mt-0.5 block text-xs text-muted-foreground">Keep amounts private when opening the dashboard.</span></span></label></CardContent></Card>
    {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">Settings saved.</p>}
    <Button className="w-full sm:ml-auto sm:w-auto" size="lg" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
  </form><DataBackupCard /><ResetDataForm /></div>
}

const initialImportState: ImportDataFormState = {}

function DataBackupCard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(importDataAction, initialImportState)

  useEffect(() => {
    if (!state.summary) return
    formRef.current?.reset()
    void refreshAppData(queryClient)
    router.refresh()
  }, [queryClient, router, state])

  const summary = state.summary

  return <Card>
    <CardHeader><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ArrowDownUp className="size-4" /></span><div className="min-w-0"><CardTitle>Import and export</CardTitle><CardDescription>Move every record in and out of this app as a single CSV file.</CardDescription></div></div></CardHeader>
    <CardContent className="grid gap-4">
      <div className="grid gap-3 rounded-lg border p-4">
        <div className="min-w-0"><strong className="text-sm font-medium">Export all data</strong><p className="mt-0.5 text-xs text-muted-foreground">Downloads your accounts, categories, transactions, loans, repayments, budgets and preferences as one CSV file.</p></div>
        <Button asChild variant="outline" className="w-full sm:w-auto sm:justify-self-start"><a href={exportDataPath} download><Download data-icon="inline-start" />Download CSV</a></Button>
      </div>
      <form ref={formRef} action={formAction} className="grid gap-3 rounded-lg border p-4" onSubmit={(event) => { if (!window.confirm("Importing replaces every account, transaction, loan and budget you have now. Continue?")) event.preventDefault() }}>
        <div className="min-w-0"><strong className="text-sm font-medium">Import all data</strong><p className="mt-0.5 text-xs text-muted-foreground">Restores a file exported above. This replaces all of your current records, so export a copy first if you want one.</p></div>
        <label className="grid min-w-0 gap-2 text-sm font-medium">CSV file<Input name="file" type="file" accept=".csv,text/csv" required disabled={pending} className="h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium" /></label>
        <label className="grid min-w-0 gap-2 text-sm font-medium">Confirm with your password<Input name="password" type="password" autoComplete="current-password" placeholder="Enter your login password" required disabled={pending} /></label>
        {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
        {summary && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">Imported {summary.accounts} accounts, {summary.categories} categories, {summary.transactions} transactions, {summary.loans} loans, {summary.repayments} repayments and {summary.budgets} budgets.</p>}
        <Button className="w-full sm:ml-auto sm:w-auto" variant="outline" size="lg" type="submit" disabled={pending}>{pending ? "Importing\u2026" : <><Upload data-icon="inline-start" />Import CSV</>}</Button>
      </form>
    </CardContent>
  </Card>
}

const initialResetState: ResetDataFormState = {}

function ResetDataForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(resetAllDataAction, initialResetState)

  useEffect(() => {
    if (!state.success) return
    formRef.current?.reset()
    void queryClient.invalidateQueries()
    router.refresh()
  }, [queryClient, router, state])

  return <Card className="border-destructive/25">
    <CardHeader><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"><Trash2 className="size-4" /></span><div className="min-w-0"><CardTitle>Reset all financial data</CardTitle><CardDescription>Delete every account, transaction, loan and budget, then start fresh. Your login and preferences will remain.</CardDescription></div></div></CardHeader>
    <CardContent><form ref={formRef} action={formAction} className="grid gap-4" onSubmit={(event) => { if (!window.confirm("Permanently delete all of your financial records? This cannot be undone.")) event.preventDefault() }}>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Confirm with your password<Input name="password" type="password" autoComplete="current-password" placeholder="Enter your login password" required disabled={pending} /></label>
      {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">All financial records were reset. You can now start fresh.</p>}
      <Button className="w-full sm:ml-auto sm:w-auto" variant="destructive" size="lg" type="submit" disabled={pending}>{pending ? "Resetting…" : "Reset all records"}</Button>
    </form></CardContent>
  </Card>
}

function SettingsSkeleton() { return <div className="grid gap-6"><Skeleton className="h-20 w-full max-w-72" />{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-48 w-full" />)}</div> }
