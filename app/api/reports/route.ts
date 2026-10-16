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

  const [current, previous, topExpenses, accounts, familyTotals, loans] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE", "TRANSFER"] } }, select: { id: true, type: true, amount: true, date: true, note: true, isFamilySupport: true, categoryId: true, sourceAccountId: true, destinationAccountId: true, category: { select: { name: true } } } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: previousStart, lt: start }, type: { in: ["INCOME", "EXPENSE"] } }, select: { type: true, amount: true, isFamilySupport: true } }),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: start, lt: end }, type: "EXPENSE" }, orderBy: { amount: "desc" }, take: 5, select: { id: true, amount: true, date: true, category: { select: { name: true } }, sourceAccount: { select: { name: true } } } }),
    prisma.account.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
    prisma.transaction.groupBy({ by: ["type"], where: { userId: user.id, isFamilySupport: true, type: { in: ["INCOME", "EXPENSE"] } }, _sum: { amount: true } }),
    prisma.loan.findMany({ where: { userId: user.id }, select: { type: true, originalAmount: true, dueDate: true, repayments: { select: { amount: true } } } }),
  ])

  const sumType = (items: Array<{ type: string; amount: number }>, type: string) => items.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0)
  // Family support is tracked separately: it never counts as the user's own income, but spending from it is still spending.
  const ownIncome = current.filter((item) => !(item.type === "INCOME" && item.isFamilySupport))
  const income = sumType(ownIncome, "INCOME"); const expense = sumType(current, "EXPENSE")
  const groupCategory = (type: "INCOME" | "EXPENSE") => Array.from(ownIncome.filter((item) => item.type === type).reduce((map, item) => { const name = item.category?.name ?? "Other"; map.set(name, (map.get(name) ?? 0) + item.amount); return map }, new Map<string, number>())).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  const accountActivity = accounts.map((account) => ({ name: account.name, income: current.filter((item) => item.type === "INCOME" && item.destinationAccountId === account.id).reduce((sum, item) => sum + item.amount, 0), expense: current.filter((item) => item.type === "EXPENSE" && item.sourceAccountId === account.id).reduce((sum, item) => sum + item.amount, 0), transfers: current.filter((item) => item.type === "TRANSFER" && (item.sourceAccountId === account.id || item.destinationAccountId === account.id)).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.income || item.expense || item.transfers)
  const loanTotals = loans.reduce((totals, loan) => { const remaining = loan.originalAmount - loan.repayments.reduce((sum, repayment) => sum + repayment.amount, 0); if (loan.type === "RECEIVABLE") totals.receivable += remaining; else totals.payable += remaining; if (remaining > 0 && loan.dueDate && loan.dueDate < new Date()) totals.overdueCount += 1; return totals }, { receivable: 0, payable: 0, overdueCount: 0 })
  const incomeSources = groupCategory("INCOME")
  const familyReceivedEntries = current.filter((item) => item.type === "INCOME" && item.isFamilySupport)
  const familySpentEntries = current.filter((item) => item.type === "EXPENSE" && item.isFamilySupport)
  const familyAllTime = (type: string) => familyTotals.find((row) => row.type === type)?._sum.amount ?? 0
  const familySpentByCategory = Array.from(familySpentEntries.reduce((map, item) => { const name = item.category?.name ?? "Other"; return map.set(name, (map.get(name) ?? 0) + item.amount) }, new Map<string, number>())).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]))
  const family = { receivedThisMonth: familyReceivedEntries.reduce((sum, item) => sum + item.amount, 0), spentThisMonth: familySpentEntries.reduce((sum, item) => sum + item.amount, 0), totalReceived: familyAllTime("INCOME"), totalSpent: familyAllTime("EXPENSE"), left: familyAllTime("INCOME") - familyAllTime("EXPENSE"), received: familyReceivedEntries.sort((a, b) => b.date.getTime() - a.date.getTime()).map((item) => ({ id: item.id, amount: item.amount, date: item.date, note: item.note, accountName: accountNames.get(item.destinationAccountId ?? "") ?? "Unknown account" })), spentByCategory: familySpentByCategory }

  const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const expenseByDay = current.reduce((map, item) => { if (item.type !== "EXPENSE") return map; const key = item.date.toISOString().slice(0, 10); return map.set(key, (map.get(key) ?? 0) + item.amount) }, new Map<string, number>())
  const dailyExpenses = Array.from({ length: daysInMonth }, (_, index) => { const date = `${month}-${String(index + 1).padStart(2, "0")}`; return { date, amount: expenseByDay.get(date) ?? 0 } })
  // An ongoing month should average over the days that have actually happened.
  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7)
  const daysCounted = month > currentMonth ? 0 : month === currentMonth ? Math.min(today.getUTCDate(), daysInMonth) : daysInMonth
  const averageDailyExpense = daysCounted ? Math.round(expense / daysCounted) : 0

  return NextResponse.json({ month, income, expense, netCashFlow: income - expense, previousIncome: sumType(previous.filter((item) => !item.isFamilySupport), "INCOME"), previousExpense: sumType(previous, "EXPENSE"), family, categoryExpenses: groupCategory("EXPENSE"), incomeSources, accountActivity, dailyExpenses, daysCounted, averageDailyExpense, topExpenses: topExpenses.map((item) => ({ id: item.id, amount: item.amount, date: item.date, categoryName: item.category?.name ?? "Other", accountName: item.sourceAccount?.name ?? "Unknown account" })), loans: loanTotals })
}
