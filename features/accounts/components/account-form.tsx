"use client"

import { useActionState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createAccountAction, updateAccountAction } from "@/features/accounts/actions"
import { accountsQueryKey } from "@/features/accounts/api"
import { accountTypeLabels, accountTypes, type AccountFormState, type AccountSummary } from "@/features/accounts/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: AccountFormState = {}

const colors = [
  { label: "Emerald", value: "emerald", className: "bg-emerald-500" },
  { label: "Blue", value: "blue", className: "bg-blue-500" },
  { label: "Violet", value: "violet", className: "bg-violet-500" },
  { label: "Amber", value: "amber", className: "bg-amber-500" },
  { label: "Rose", value: "rose", className: "bg-rose-500" },
  { label: "Slate", value: "slate", className: "bg-slate-500" },
]

type AccountFormProps = {
  account?: AccountSummary
  onSuccess: () => void
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(account ? updateAccountAction : createAccountAction, initialState)

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return (
    <form action={formAction} className="grid gap-4">
      {account && <input type="hidden" name="accountId" value={account.id} />}
      <div className="grid gap-2">
        <label htmlFor="account-name" className="text-sm font-medium">Account name</label>
        <Input id="account-name" name="name" defaultValue={account?.name} placeholder="e.g. City Bank" required maxLength={40} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Account type
          <select name="type" defaultValue={account?.type ?? "CASH"} className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25">
            {accountTypes.map((type) => <option key={type} value={type}>{accountTypeLabels[type]}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">Opening balance
          <Input name="openingBalance" type="text" inputMode="decimal" defaultValue={account ? String(account.openingBalance / 100) : "0"} placeholder="0.00" required />
        </label>
      </div>
      <div className="grid gap-2">
        <label htmlFor="account-identifier" className="inline-flex items-baseline gap-1 text-sm font-medium">Account number or note <span className="whitespace-nowrap font-normal text-muted-foreground">(optional)</span></label>
        <Input id="account-identifier" name="identifier" defaultValue={account?.identifier ?? ""} placeholder="Last four digits or a short note" maxLength={80} />
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-medium">Account color</span>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <label key={color.value} className="cursor-pointer">
              <input className="peer sr-only" type="radio" name="color" value={color.value} defaultChecked={(account?.color ?? "emerald") === color.value} />
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-transparent peer-checked:border-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/30"><span className={`size-4 rounded-full ${color.className}`} /><span className="sr-only">{color.label}</span></span>
            </label>
          ))}
        </div>
      </div>
      {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
      <DialogFooter className="mt-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : account ? "Save changes" : "Create account"}</Button>
      </DialogFooter>
    </form>
  )
}
