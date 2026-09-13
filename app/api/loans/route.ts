import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const loans = await prisma.loan.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }], include: { person: { select: { id: true, name: true, contact: true, note: true } }, originAccount: { select: { id: true, name: true } }, transactions: { where: { type: "LOAN_DISBURSEMENT" }, select: { id: true } }, repayments: { orderBy: { date: "desc" }, include: { account: { select: { id: true, name: true } } } } } })
  const today = new Date()
  return NextResponse.json(loans.map(({ transactions, ...loan }) => { const repaidAmount = loan.repayments.reduce((total, repayment) => total + repayment.amount, 0); const remainingAmount = loan.originalAmount - repaidAmount; const status = remainingAmount > 0 && loan.dueDate && loan.dueDate < today ? "OVERDUE" : loan.status; return { ...loan, isOpeningLoan: transactions.length === 0, repaidAmount, remainingAmount, status } }))
}
