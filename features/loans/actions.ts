"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { getUserAccountBalance } from "@/lib/money/account-balances"
import { parseMoneyInput } from "@/lib/money/currency"
import type { LoanFormState } from "@/features/loans/types"

function parseDate(value: string, optional = false) { if (!value && optional) return undefined; if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null; const date = new Date(`${value}T12:00:00.000Z`); return Number.isNaN(date.getTime()) ? null : date }
function refreshLoans() { revalidatePath("/"); revalidatePath("/accounts"); revalidatePath("/loans"); revalidatePath("/transactions"); revalidatePath("/reports") }

export async function createLoanAction(_: LoanFormState, formData: FormData): Promise<LoanFormState> {
  const user = await requireUser(); const type = String(formData.get("type") ?? ""); const personName = String(formData.get("personName") ?? "").trim(); const personContact = String(formData.get("personContact") ?? "").trim() || null; const amount = parseMoneyInput(String(formData.get("amount") ?? "")); const accountId = String(formData.get("accountId") ?? ""); const startDate = parseDate(String(formData.get("startDate") ?? "")); const dueDate = parseDate(String(formData.get("dueDate") ?? ""), true); const note = String(formData.get("note") ?? "").trim(); const isOpeningLoan = formData.get("isOpeningLoan") === "on"
  if ((type !== "RECEIVABLE" && type !== "PAYABLE") || personName.length < 2 || personName.length > 60 || amount === null || amount <= 0 || !accountId || !startDate || dueDate === null || note.length > 300) return { error: "Enter valid loan details." }
  if (dueDate && dueDate < startDate) return { error: "Due date cannot be before the loan date." }
  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id, isArchived: false }, select: { id: true } }); if (!account) return { error: "Choose an active account." }
  const availableBalance = await getUserAccountBalance(user.id, account.id)
  if (!isOpeningLoan && type === "RECEIVABLE" && (availableBalance === null || availableBalance < amount)) return { error: "This account does not have enough balance to lend this amount." }
  await prisma.$transaction(async (tx) => { const loan = await tx.loan.create({ data: { personName, personContact, type, originalAmount: amount, startDate, dueDate, note: note || null, userId: user.id, originAccountId: account.id } }); if (!isOpeningLoan) await tx.transaction.create({ data: { type: "LOAN_DISBURSEMENT", amount, date: startDate, note: note || null, userId: user.id, loanId: loan.id, ...(type === "RECEIVABLE" ? { sourceAccountId: account.id } : { destinationAccountId: account.id }) } }) })
  refreshLoans(); return { success: true }
}

export async function updateLoanAction(_: LoanFormState, formData: FormData): Promise<LoanFormState> {
  const user = await requireUser(); const loanId = String(formData.get("loanId") ?? ""); const type = String(formData.get("type") ?? ""); const personName = String(formData.get("personName") ?? "").trim(); const personContact = String(formData.get("personContact") ?? "").trim() || null; const amount = parseMoneyInput(String(formData.get("amount") ?? "")); const accountId = String(formData.get("accountId") ?? ""); const startDate = parseDate(String(formData.get("startDate") ?? "")); const dueDate = parseDate(String(formData.get("dueDate") ?? ""), true); const note = String(formData.get("note") ?? "").trim(); const isOpeningLoan = formData.get("isOpeningLoan") === "on"
  if (!loanId || (type !== "RECEIVABLE" && type !== "PAYABLE") || personName.length < 2 || personName.length > 60 || amount === null || amount <= 0 || !accountId || !startDate || dueDate === null || note.length > 300) return { error: "Enter valid loan details." }
  if (dueDate && dueDate < startDate) return { error: "Due date cannot be before the loan date." }

  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId: user.id }, include: { repayments: { select: { amount: true } }, transactions: { where: { type: "LOAN_DISBURSEMENT" }, select: { id: true, sourceAccountId: true, destinationAccountId: true, amount: true } } } })
  if (!loan) return { error: "This loan could not be found." }
  const repaid = loan.repayments.reduce((total, repayment) => total + repayment.amount, 0)
  if (amount < repaid) return { error: "Loan amount cannot be less than the amount already repaid." }
  if (loan.repayments.length > 0 && type !== loan.type) return { error: "Loan type cannot be changed after a repayment has been added." }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id, isArchived: false }, select: { id: true } })
  if (!account) return { error: "Choose an active account." }
  const disbursement = loan.transactions[0]
  if (!isOpeningLoan && type === "RECEIVABLE") {
    const availableBalance = await getUserAccountBalance(user.id, account.id)
    const restoredAmount = disbursement?.sourceAccountId === account.id ? disbursement.amount : 0
    if (availableBalance === null || availableBalance + restoredAmount < amount) return { error: "This account does not have enough balance for this loan amount." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({ where: { id: loan.id }, data: { personName, personContact, type, originalAmount: amount, startDate, dueDate, note: note || null, originAccountId: account.id, status: amount === repaid ? "PAID" : repaid > 0 ? "PARTIALLY_PAID" : "ACTIVE" } })
    if (isOpeningLoan && disbursement) await tx.transaction.delete({ where: { id: disbursement.id } })
    if (!isOpeningLoan && disbursement) await tx.transaction.update({ where: { id: disbursement.id }, data: { amount, date: startDate, note: note || null, sourceAccountId: type === "RECEIVABLE" ? account.id : null, destinationAccountId: type === "PAYABLE" ? account.id : null } })
    if (!isOpeningLoan && !disbursement) await tx.transaction.create({ data: { type: "LOAN_DISBURSEMENT", amount, date: startDate, note: note || null, userId: user.id, loanId: loan.id, ...(type === "RECEIVABLE" ? { sourceAccountId: account.id } : { destinationAccountId: account.id }) } })
  })

  refreshLoans(); return { success: true }
}

export async function createRepaymentAction(_: LoanFormState, formData: FormData): Promise<LoanFormState> {
  const user = await requireUser(); const loanId = String(formData.get("loanId") ?? ""); const accountId = String(formData.get("accountId") ?? ""); const amount = parseMoneyInput(String(formData.get("amount") ?? "")); const date = parseDate(String(formData.get("date") ?? "")); const note = String(formData.get("note") ?? "").trim(); const extraCategoryField = formData.get("extraCategoryId")
  if (!loanId || !accountId || amount === null || amount <= 0 || !date || note.length > 300) return { error: "Enter valid repayment details." }
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId: user.id, status: { notIn: ["PAID", "CANCELLED"] } }, include: { repayments: { select: { amount: true } } } }); if (!loan) return { error: "This loan is no longer available." }
  const repaid = loan.repayments.reduce((total, repayment) => total + repayment.amount, 0); const remaining = loan.originalAmount - repaid

  // Paying more than the loan is normal (a cash-out fee covered by the other person, or
  // simple goodwill). Only the remaining amount settles the loan; the rest is ordinary
  // income or expense so balances and reports both stay honest.
  const applied = Math.min(amount, remaining); const extra = amount - applied
  const extraType = loan.type === "RECEIVABLE" ? "INCOME" : "EXPENSE"
  // A missing field means the form never showed the picker, so fall back to the default
  // "Other" category. An empty one means the user deliberately chose Uncategorized.
  const chosenCategoryId = typeof extraCategoryField === "string" ? extraCategoryField : null
  const extraCategory = extra > 0 && chosenCategoryId !== ""
    ? await prisma.category.findFirst({ where: chosenCategoryId ? { id: chosenCategoryId, userId: user.id, type: extraType, isArchived: false } : { userId: user.id, type: extraType, isDefault: true, isArchived: false, name: extraType === "INCOME" ? "Other income" : "Other expense" }, select: { id: true } })
    : null
  if (extra > 0 && chosenCategoryId && !extraCategory) return { error: `Choose a valid ${extraType.toLowerCase()} category for the extra amount.` }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id, isArchived: false }, select: { id: true } }); if (!account) return { error: "Choose an active account." }
  const repaymentBalance = await getUserAccountBalance(user.id, account.id)
  if (loan.type === "PAYABLE" && (repaymentBalance === null || repaymentBalance < amount)) return { error: "This account does not have enough balance for this repayment." }

  await prisma.$transaction(async (tx) => {
    if (applied > 0) {
      const repayment = await tx.loanRepayment.create({ data: { amount: applied, date, note: note || null, userId: user.id, loanId: loan.id, accountId: account.id } })
      await tx.transaction.create({ data: { type: "LOAN_REPAYMENT", amount: applied, date, note: note || null, userId: user.id, loanId: loan.id, repaymentId: repayment.id, ...(loan.type === "RECEIVABLE" ? { destinationAccountId: account.id } : { sourceAccountId: account.id }) } })
    }
    if (extra > 0) await tx.transaction.create({ data: { type: extraType, amount: extra, date, note: note || `Extra on repayment from ${loan.personName}`, userId: user.id, categoryId: extraCategory?.id ?? null, ...(extraType === "INCOME" ? { destinationAccountId: account.id } : { sourceAccountId: account.id }) } })
    const totalRepaid = repaid + applied
    await tx.loan.update({ where: { id: loan.id }, data: { status: totalRepaid === loan.originalAmount ? "PAID" : "PARTIALLY_PAID" } })
  })
  refreshLoans(); return { success: true }
}

export async function deleteLoanAction(formData: FormData) {
  const user = await requireUser()
  const loanId = String(formData.get("loanId") ?? "")
  if (!loanId) return

  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId: user.id }, select: { id: true } })
  if (!loan) return

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { loanId: loan.id, userId: user.id } })
    await tx.loanRepayment.deleteMany({ where: { loanId: loan.id, userId: user.id } })
    await tx.loan.delete({ where: { id: loan.id } })
  })

  refreshLoans()
}
