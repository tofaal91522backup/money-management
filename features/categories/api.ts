import type { CategorySummary } from "@/features/categories/types"

export const categoriesQueryKey = ["categories"] as const

export async function getCategories(): Promise<CategorySummary[]> {
  const response = await fetch("/api/categories")

  if (!response.ok) {
    throw new Error("We could not load your categories. Please refresh and try again.")
  }

  return response.json() as Promise<CategorySummary[]>
}
