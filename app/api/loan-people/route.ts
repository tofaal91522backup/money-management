import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const people = await prisma.loanPerson.findMany({ where: { userId: user.id }, orderBy: { name: "asc" }, select: { id: true, name: true, contact: true, note: true, createdAt: true, loans: { select: { type: true, originalAmount: true, repayments: { select: { amount: true } } } } } })
  return NextResponse.json(people.map(({ loans, ...person }) => {
    const totals = loans.reduce((sums, loan) => {
      const remaining = loan.originalAmount - loan.repayments.reduce((total, repayment) => total + repayment.amount, 0)
      if (loan.type === "RECEIVABLE") sums.receivableRemaining += remaining; else sums.payableRemaining += remaining
      return sums
    }, { receivableRemaining: 0, payableRemaining: 0 })
    return { ...person, loanCount: loans.length, ...totals }
  }))
}
