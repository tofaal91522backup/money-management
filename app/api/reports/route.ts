import { NextRequest, NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

function monthRange(month: string) {
  const start = new Date(`${month}-01T00:00:00.000Z`)
  return { start, end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)) }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const month = request.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 })
  const { start, end } = monthRange(month)
  const previousStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1))

  const [current, previous, topExpenses, accounts, loans] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE", "TRANSFER"] } }, select: { type: true, amount: true, categoryId: true, sourceAccountId: true, destinationAccountId: true, category: { select: { name: true } } } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: previousStart, lt: start }, type: { in: ["INCOME", "EXPENSE"] } }, select: { type: true, amount: true } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: start, lt: end }, type: "EXPENSE" }, orderBy: { amount: "desc" }, take: 5, select: { id: true, amount: true, date: true, category: { select: { name: true } }, sourceAccount: { select: { name: true } } } }),
    prisma.account.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
    prisma.loan.findMany({ where: { userId: user.id }, select: { type: true, originalAmount: true, dueDate: true, repayments: { select: { amount: true } } } }),
  ])

  const sumType = (items: Array<{ type: string; amount: number }>, type: string) => items.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0)
  const income = sumType(current, "INCOME"); const expense = sumType(current, "EXPENSE")
  const groupCategory = (type: "INCOME" | "EXPENSE") => Array.from(current.filter((item) => item.type === type).reduce((map, item) => { const name = item.category?.name ?? "Other"; map.set(name, (map.get(name) ?? 0) + item.amount); return map }, new Map<string, number>())).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  const accountActivity = accounts.map((account) => ({ name: account.name, income: current.filter((item) => item.type === "INCOME" && item.destinationAccountId === account.id).reduce((sum, item) => sum + item.amount, 0), expense: current.filter((item) => item.type === "EXPENSE" && item.sourceAccountId === account.id).reduce((sum, item) => sum + item.amount, 0), transfers: current.filter((item) => item.type === "TRANSFER" && (item.sourceAccountId === account.id || item.destinationAccountId === account.id)).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.income || item.expense || item.transfers)
  const loanTotals = loans.reduce((totals, loan) => { const remaining = loan.originalAmount - loan.repayments.reduce((sum, repayment) => sum + repayment.amount, 0); if (loan.type === "RECEIVABLE") totals.receivable += remaining; else totals.payable += remaining; if (remaining > 0 && loan.dueDate && loan.dueDate < new Date()) totals.overdueCount += 1; return totals }, { receivable: 0, payable: 0, overdueCount: 0 })
  const incomeSources = groupCategory("INCOME")

  return NextResponse.json({ month, income, expense, netCashFlow: income - expense, previousIncome: sumType(previous, "INCOME"), previousExpense: sumType(previous, "EXPENSE"), familySupport: incomeSources.filter((item) => item.name.toLowerCase().includes("family") || item.name.includes("বাবা")).reduce((sum, item) => sum + item.amount, 0), categoryExpenses: groupCategory("EXPENSE"), incomeSources, accountActivity, topExpenses: topExpenses.map((item) => ({ id: item.id, amount: item.amount, date: item.date, categoryName: item.category?.name ?? "Other", accountName: item.sourceAccount?.name ?? "Unknown account" })), loans: loanTotals })
}
