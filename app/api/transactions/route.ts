import { NextRequest, NextResponse } from "next/server"
import type { Prisma, TransactionType } from "@/generated/prisma/client"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

const pageSize = 12
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const params = request.nextUrl.searchParams; const page = Math.max(1, Number(params.get("page")) || 1); const type = params.get("type"); const accountId = params.get("accountId"); const categoryId = params.get("categoryId"); const search = params.get("search")?.trim(); const startDate = params.get("startDate"); const endDate = params.get("endDate")
  const requestedType: TransactionType | undefined = type === "INCOME" || type === "EXPENSE" || type === "TRANSFER" ? type : undefined
  const where: Prisma.TransactionWhereInput = { userId: user.id, type: requestedType ?? { in: ["INCOME", "EXPENSE", "TRANSFER"] }, ...(accountId ? { OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }] } : {}), ...(categoryId ? { categoryId } : {}), ...(search ? { AND: [{ OR: [{ note: { contains: search } }, { category: { name: { contains: search } } }] }] } : {}), ...(startDate || endDate ? { date: { ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}), ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}) } } : {}) }
  const [items, total] = await Promise.all([prisma.transaction.findMany({ where, orderBy: [{ date: "desc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize, select: { id: true, type: true, amount: true, feeAmount: true, date: true, note: true, category: { select: { id: true, name: true, color: true } }, sourceAccount: { select: { id: true, name: true } }, destinationAccount: { select: { id: true, name: true } } } }), prisma.transaction.count({ where })])
  return NextResponse.json({ items: items.map((item) => ({ id: item.id, type: item.type, amount: item.amount, feeAmount: item.feeAmount, date: item.date, note: item.note, category: item.category, account: item.sourceAccount ?? item.destinationAccount, sourceAccount: item.sourceAccount, destinationAccount: item.destinationAccount })), total, page, pageSize })
}
