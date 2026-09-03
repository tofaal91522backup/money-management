import { NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rawMonth = request.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(rawMonth)) return NextResponse.json({ error: "Invalid month" }, { status: 400 })

  const start = new Date(`${rawMonth}-01T00:00:00.000Z`)
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id, month: start },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, type: "EXPENSE", date: { gte: start, lt: end } },
      select: { amount: true, categoryId: true },
    }),
  ])
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0)
  return NextResponse.json(budgets.map((budget) => {
    const spent = budget.scope === "TOTAL" ? totalSpent : expenses.filter((item) => item.categoryId === budget.categoryId).reduce((sum, item) => sum + item.amount, 0)
    return { id: budget.id, scope: budget.scope, amount: budget.amount, month: rawMonth, category: budget.category, spent, progress: spent / budget.amount }
  }))
}
