import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { getUserAccountBalances } from "@/lib/money/account-balances"

export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const now = new Date(); const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); const today = new Date()
  const [accounts, monthTransactions, loans, recentTransactions, groupedExpenses, settings] = await Promise.all([
    getUserAccountBalances(user.id),
    prisma.transaction.findMany({ where: { userId: user.id, date: { gte: monthStart }, type: { in: ["INCOME", "EXPENSE"] } }, select: { type: true, amount: true } }),
    prisma.loan.findMany({ where: { userId: user.id }, select: { type: true, originalAmount: true, dueDate: true, status: true, repayments: { select: { amount: true } } } }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6, select: { id: true, type: true, amount: true, date: true, note: true, category: { select: { name: true } }, sourceAccount: { select: { name: true } }, destinationAccount: { select: { name: true } } } }),
    prisma.transaction.groupBy({ by: ["categoryId"], where: { userId: user.id, type: "EXPENSE", date: { gte: monthStart }, categoryId: { not: null } }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 5 }),
    prisma.userSettings.findUnique({ where: { userId: user.id }, select: { hideBalances: true } }),
  ])
  const categoryIds = groupedExpenses.map((item) => item.categoryId).filter((id): id is string => Boolean(id)); const categories = await prisma.category.findMany({ where: { id: { in: categoryIds }, userId: user.id }, select: { id: true, name: true } }); const names = new Map(categories.map((category) => [category.id, category.name]))
  const monthIncome = monthTransactions.filter((item) => item.type === "INCOME").reduce((total, item) => total + item.amount, 0); const monthExpense = monthTransactions.filter((item) => item.type === "EXPENSE").reduce((total, item) => total + item.amount, 0)
  const loanTotals = loans.reduce((total, loan) => { const remaining = loan.originalAmount - loan.repayments.reduce((sum, repayment) => sum + repayment.amount, 0); if (loan.type === "RECEIVABLE") total.receivable += remaining; else total.payable += remaining; if (remaining > 0 && loan.dueDate && loan.dueDate < today) total.overdueLoanCount += 1; return total }, { receivable: 0, payable: 0, overdueLoanCount: 0 })
  return NextResponse.json({ totalBalance: accounts.filter((account) => !account.isArchived).reduce((total, account) => total + account.balance, 0), accountCount: accounts.filter((account) => !account.isArchived).length, monthIncome, monthExpense, netCashFlow: monthIncome - monthExpense, hideBalances: settings?.hideBalances ?? false, ...loanTotals, recentTransactions: recentTransactions.map((item) => ({ id: item.id, type: item.type, amount: item.amount, date: item.date, note: item.note, categoryName: item.category?.name ?? null, sourceAccountName: item.sourceAccount?.name ?? null, destinationAccountName: item.destinationAccount?.name ?? null })), topCategories: groupedExpenses.map((item) => ({ name: names.get(item.categoryId ?? "") ?? "Other", amount: item._sum.amount ?? 0 })) })
}
