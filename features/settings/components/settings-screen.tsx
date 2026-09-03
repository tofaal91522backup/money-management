"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleUserRound, Palette, SlidersHorizontal, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { accountsQueryKey, getAccounts } from "@/features/accounts/api"
import { resetAllDataAction, updateSettingsAction } from "@/features/settings/actions"
import { getSettings } from "@/features/settings/api"
import { settingsQueryKey, type ResetDataFormState, type SettingsFormState, type ThemePreference } from "@/features/settings/types"
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
    <Card><CardHeader><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><CircleUserRound className="size-4" /></span><div><CardTitle>Profile</CardTitle><CardDescription>Your login email cannot be changed here.</CardDescription></div></div></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Display name<Input name="name" defaultValue={settings.name ?? ""} placeholder="Your name" maxLength={60} /></label><label className="grid gap-2 text-sm font-medium">Email<Input value={settings.email} disabled /></label></CardContent></Card>
    <Card><CardHeader><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Palette className="size-4" /></span><div><CardTitle>Appearance</CardTitle><CardDescription>Choose a comfortable color theme.</CardDescription></div></div></CardHeader><CardContent><div className="grid grid-cols-3 gap-2">{(["LIGHT", "DARK", "SYSTEM"] as const).map((value) => <button key={value} type="button" onClick={() => setThemeValue(value)} className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${theme === value ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</button>)}</div><input type="hidden" name="theme" value={theme} /></CardContent></Card>
    <Card><CardHeader><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><SlidersHorizontal className="size-4" /></span><div><CardTitle>Money preferences</CardTitle><CardDescription>Defaults used throughout the app.</CardDescription></div></div></CardHeader><CardContent className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Currency<Input value="Bangladeshi Taka (BDT)" disabled /></label><label className="grid gap-2 text-sm font-medium">Default account<select name="defaultAccountId" defaultValue={settings.defaultAccountId ?? ""} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="">No default account</option>{accounts.filter((account) => !account.isArchived).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div><label className="flex items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" name="hideBalances" defaultChecked={settings.hideBalances} className="size-4 accent-[var(--primary)]" /><span><strong className="font-medium">Hide balances by default</strong><span className="mt-0.5 block text-xs text-muted-foreground">Keep amounts private when opening the dashboard.</span></span></label></CardContent></Card>
    {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
    {state.success && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">Settings saved.</p>}
    <Button className="w-full sm:ml-auto sm:w-auto" size="lg" type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
  </form><ResetDataForm /></div>
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
    <CardHeader><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive"><Trash2 className="size-4" /></span><div><CardTitle>Reset all financial data</CardTitle><CardDescription>Delete every account, transaction, loan and budget, then start fresh. Your login and preferences will remain.</CardDescription></div></div></CardHeader>
    <CardContent><form ref={formRef} action={formAction} className="grid gap-4" onSubmit={(event) => { if (!window.confirm("Permanently delete all of your financial records? This cannot be undone.")) event.preventDefault() }}>
      <label className="grid gap-2 text-sm font-medium">Confirm with your password<Input name="password" type="password" autoComplete="current-password" placeholder="Enter your login password" required disabled={pending} /></label>
      {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="rounded-lg border border-success-foreground/15 bg-success px-3 py-2.5 text-sm text-success-foreground">All financial records were reset. You can now start fresh.</p>}
      <Button className="w-full sm:ml-auto sm:w-auto" variant="destructive" size="lg" type="submit" disabled={pending}>{pending ? "Resetting…" : "Reset all records"}</Button>
    </form></CardContent>
  </Card>
}

function SettingsSkeleton() { return <div className="grid gap-6"><Skeleton className="h-20 w-72" />{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-48 w-full" />)}</div> }
