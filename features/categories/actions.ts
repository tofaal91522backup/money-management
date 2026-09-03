"use server"

import { revalidatePath } from "next/cache"

import { categoryTypes, type CategoryFormState, type CategoryType } from "@/features/categories/types"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

function getCategoryInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const type = String(formData.get("type") ?? "") as CategoryType
  const icon = String(formData.get("icon") ?? "").trim() || "CircleDot"
  const color = String(formData.get("color") ?? "").trim() || "emerald"

  if (name.length < 2 || name.length > 40) {
    return { error: "Category name must be between 2 and 40 characters." } as const
  }

  if (!categoryTypes.includes(type)) {
    return { error: "Choose a valid category type." } as const
  }

  return { data: { name, type, icon, color } } as const
}

function refreshCategoryPages() {
  revalidatePath("/categories")
  revalidatePath("/")
}

export async function createCategoryAction(_: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const user = await requireUser()
  const parsed = getCategoryInput(formData)

  if ("error" in parsed) return parsed

  try {
    await prisma.category.create({ data: { ...parsed.data, userId: user.id } })
  } catch {
    return { error: "A category with this name already exists for that type." }
  }

  refreshCategoryPages()
  return { success: true }
}

export async function updateCategoryAction(_: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const user = await requireUser()
  const categoryId = String(formData.get("categoryId") ?? "")
  const parsed = getCategoryInput(formData)

  if (!categoryId) return { error: "We could not find that category." }
  if ("error" in parsed) return parsed

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId: user.id },
    select: { id: true, type: true, isDefault: true, _count: { select: { transactions: true, budgets: true } } },
  })

  if (!category) return { error: "This category is no longer available." }

  const hasHistory = category._count.transactions + category._count.budgets > 0
  if ((category.isDefault || hasHistory) && category.type !== parsed.data.type) {
    return { error: "This category type cannot change because it is part of your existing setup or history." }
  }

  try {
    await prisma.category.update({ where: { id: category.id }, data: parsed.data })
  } catch {
    return { error: "A category with this name already exists for that type." }
  }

  refreshCategoryPages()
  return { success: true }
}

export async function toggleCategoryArchiveAction(formData: FormData) {
  const user = await requireUser()
  const categoryId = String(formData.get("categoryId") ?? "")
  const archive = formData.get("archive") === "true"

  if (!categoryId) return

  await prisma.category.updateMany({
    where: { id: categoryId, userId: user.id },
    data: { isArchived: archive },
  })

  refreshCategoryPages()
}
