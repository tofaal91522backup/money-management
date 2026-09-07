"use client"

import { useActionState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createCategoryAction, updateCategoryAction } from "@/features/categories/actions"
import { categoriesQueryKey } from "@/features/categories/api"
import { categoryTypeLabels, categoryTypes, type CategoryFormState, type CategorySummary } from "@/features/categories/types"
import { refreshAppData } from "@/lib/query/refresh-app-data"

const initialState: CategoryFormState = {}
const icons = ["CircleDot", "HeartHandshake", "WalletCards", "BusFront", "Utensils", "ShoppingBag", "House", "Zap", "HeartPulse", "GraduationCap", "Plane", "Sparkles"]
const colorClasses = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
} as const
const colors = Object.keys(colorClasses) as Array<keyof typeof colorClasses>

type CategoryFormProps = { category?: CategorySummary; onSuccess: () => void }

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const queryClient = useQueryClient()
  const [state, formAction, pending] = useActionState(category ? updateCategoryAction : createCategoryAction, initialState)
  const typeIsLocked = Boolean(category?.isDefault)

  useEffect(() => {
    if (state.success) {
      void refreshAppData(queryClient)
      onSuccess()
    }
  }, [onSuccess, queryClient, state])

  return (
    <form action={formAction} className="grid gap-4">
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      {category?.isDefault && <input type="hidden" name="type" value={category.type} />}
      <div className="grid gap-2"><label htmlFor="category-name" className="text-sm font-medium">Category name</label><Input id="category-name" name="name" defaultValue={category?.name} placeholder="e.g. Transport" required maxLength={40} /></div>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Type
        <select name={typeIsLocked ? undefined : "type"} disabled={typeIsLocked} defaultValue={category?.type ?? "EXPENSE"} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60">
          {categoryTypes.map((type) => <option key={type} value={type}>{categoryTypeLabels[type]}</option>)}
        </select>
        {typeIsLocked && <span className="text-xs font-normal text-muted-foreground">Default category types stay fixed to keep reports consistent.</span>}
      </label>
      <label className="grid min-w-0 gap-2 text-sm font-medium">Icon
        <select name="icon" defaultValue={category?.icon ?? "CircleDot"} className="h-10 w-full min-w-0 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25">
          {icons.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
        </select>
      </label>
      <div className="grid gap-2"><span className="text-sm font-medium">Color</span><div className="flex flex-wrap gap-2">{colors.map((color) => <label key={color} className="cursor-pointer"><input className="peer sr-only" type="radio" name="color" value={color} defaultChecked={(category?.color ?? "emerald") === color} /><span className={`block size-7 rounded-full border-2 border-transparent ${colorClasses[color]} peer-checked:border-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/30`}><span className="sr-only">{color}</span></span></label>)}</div></div>
      {state.error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{state.error}</p>}
      <DialogFooter className="mt-2"><Button type="submit" disabled={pending}>{pending ? "Saving…" : category ? "Save changes" : "Create category"}</Button></DialogFooter>
    </form>
  )
}
