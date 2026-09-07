"use client"

import { Archive, CircleDot, Pencil, Plus, Tags } from "lucide-react"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { toggleCategoryArchiveAction } from "@/features/categories/actions"
import { categoriesQueryKey, getCategories } from "@/features/categories/api"
import { CategoryForm } from "@/features/categories/components/category-form"
import { categoryTypeLabels, type CategorySummary, type CategoryType } from "@/features/categories/types"
import { cn } from "@/lib/utils"
import { refreshAppData } from "@/lib/query/refresh-app-data"

export function CategoriesScreen() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategorySummary | null>(null)
  const [selectedType, setSelectedType] = useState<CategoryType>("EXPENSE")
  const { data: categories = [], isPending, isError, refetch } = useQuery({ queryKey: categoriesQueryKey, queryFn: getCategories })
  const activeCategories = categories.filter((category) => !category.isArchived && category.type === selectedType)
  const archivedCategories = categories.filter((category) => category.isArchived)
  const toggleArchive = async (formData: FormData) => { await toggleCategoryArchiveAction(formData); await refreshAppData(queryClient) }

  return <div className="grid gap-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1><p className="mt-1 text-sm text-muted-foreground">Organize every income source and spending area your way.</p></div><Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="size-4" /> Add category</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add a category</DialogTitle><DialogDescription>Keep the name short so it is easy to scan in transactions and reports.</DialogDescription></DialogHeader><CategoryForm onSuccess={() => setCreateOpen(false)} /></DialogContent></Dialog></div>
    <div className="grid w-full grid-cols-2 rounded-lg bg-muted p-1 sm:inline-flex sm:w-fit">{(["EXPENSE", "INCOME"] as const).map((type) => <button key={type} onClick={() => setSelectedType(type)} className={cn("min-w-0 truncate rounded-md px-4 py-2 text-sm font-medium transition-colors", selectedType === type ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{categoryTypeLabels[type]}</button>)}</div>
    {isPending && <CategoriesSkeleton />}
    {isError && <EmptyState icon={Tags} title="Could not load categories" description="Your categories are still safe. Please try again." action={<Button onClick={() => refetch()}>Try again</Button>} />}
    {!isPending && !isError && activeCategories.length === 0 && <EmptyState icon={Tags} title={`No ${categoryTypeLabels[selectedType].toLowerCase()} categories yet`} description="Create a category to keep your transactions neatly organized." action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" /> Add category</Button>} />}
    {!isPending && !isError && activeCategories.length > 0 && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{activeCategories.map((category) => <CategoryCard key={category.id} category={category} onEdit={() => setEditingCategory(category)} onToggleArchive={toggleArchive} />)}</section>}
    {!isPending && !isError && archivedCategories.length > 0 && <section className="grid gap-3"><div><h2 className="text-sm font-semibold">Archived categories</h2><p className="mt-1 text-sm text-muted-foreground">History stays intact while archived categories stay out of new entries.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{archivedCategories.map((category) => <CategoryCard key={category.id} category={category} onEdit={() => setEditingCategory(category)} onToggleArchive={toggleArchive} />)}</div></section>}
    <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => !open && setEditingCategory(null)}><DialogContent><DialogHeader><DialogTitle>Edit category</DialogTitle><DialogDescription>Categories with history retain their type to keep reports accurate.</DialogDescription></DialogHeader>{editingCategory && <CategoryForm category={editingCategory} onSuccess={() => setEditingCategory(null)} />}</DialogContent></Dialog>
  </div>
}

function CategoryCard({ category, onEdit, onToggleArchive }: { category: CategorySummary; onEdit: () => void; onToggleArchive: (formData: FormData) => Promise<void> }) {
  return <Card className={category.isArchived ? "opacity-70" : undefined}><CardContent className="flex items-center gap-3 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleDot className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{category.name}</p><div className="mt-1 flex flex-wrap items-center gap-1.5">{category.isDefault && <Badge variant="secondary">Default</Badge>}{category.isArchived && <Badge variant="secondary">Archived</Badge>}</div></div><div className="flex shrink-0 items-center"><Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${category.name}`}><Pencil className="size-3.5" /></Button><form action={onToggleArchive}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="archive" value={String(!category.isArchived)} /><Button variant="ghost" size="icon-sm" type="submit" aria-label={category.isArchived ? `Restore ${category.name}` : `Archive ${category.name}`}><Archive className="size-3.5" /></Button></form></div></CardContent></Card>
}

function CategoriesSkeleton() { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Card key={index}><CardContent className="flex items-center gap-3 p-4"><Skeleton className="size-10 rounded-xl" /><Skeleton className="h-5 w-28" /></CardContent></Card>)}</div> }
