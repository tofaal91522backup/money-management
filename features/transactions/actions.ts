"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { getUserAccountBalance } from "@/lib/money/account-balances"
import { parseMoneyInput } from "@/lib/money/currency"

export type TransactionFormState = { error?: string; success?: boolean }

function parseTransactionDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T12:00:00.000Z`)
  const today = new Date(); today.setHours(23, 59, 59, 999)
  return Number.isNaN(date.getTime()) || date > today ? null : date
}

function getTransactionInput(formData: FormData) {
  const type = String(formData.get("type") ?? "")
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
  const accountId = String(formData.get("accountId") ?? "")
  const categoryId = String(formData.get("categoryId") ?? "")
  const date = parseTransactionDate(String(formData.get("date") ?? ""))
  const note = String(formData.get("note") ?? "").trim()
  if (type !== "INCOME" && type !== "EXPENSE") return { error: "Choose income or expense." } as const
  if (amount === null || amount <= 0) return { error: "Enter an amount greater than zero." } as const
  if (!accountId || !categoryId || !date) return { error: "Choose an account, category, and valid date." } as const
  if (note.length > 300) return { error: "A note can be up to 300 characters." } as const
  return { data: { type, amount, accountId, categoryId, date, note } } as const
}

async function validateReferences(userId: string, input: { type: "INCOME" | "EXPENSE"; accountId: string; categoryId: string }) {
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: input.accountId, userId, isArchived: false }, select: { id: true } }),
    prisma.category.findFirst({ where: { id: input.categoryId, userId, type: input.type, isArchived: false }, select: { id: true } }),
  ])
  return { account, category }
}

async function canPayExpense(userId: string, accountId: string, amount: number, replacedExpense?: { sourceAccountId: string | null; amount: number }) {
  let balance = await getUserAccountBalance(userId, accountId)
  if (balance === null) return false
  if (replacedExpense?.sourceAccountId === accountId) balance += replacedExpense.amount
  return amount <= balance
}

function refreshTransactionPages() { revalidatePath("/"); revalidatePath("/accounts"); revalidatePath("/transactions") }

export async function createTransactionAction(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const user = await requireUser(); const parsed = getTransactionInput(formData)
  if ("error" in parsed) return parsed
  const { account, category } = await validateReferences(user.id, parsed.data)
  if (!account) return { error: "Choose an active account." }
  if (!category) return { error: "Choose a matching active category." }
  if (parsed.data.type === "EXPENSE" && !(await canPayExpense(user.id, account.id, parsed.data.amount))) return { error: "This expense is larger than the available account balance." }
  await prisma.transaction.create({ data: { type: parsed.data.type, amount: parsed.data.amount, date: parsed.data.date, note: parsed.data.note || null, categoryId: category.id, userId: user.id, ...(parsed.data.type === "INCOME" ? { destinationAccountId: account.id } : { sourceAccountId: account.id }) } })
  refreshTransactionPages(); return { success: true }
}

export async function updateTransactionAction(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const user = await requireUser(); const transactionId = String(formData.get("transactionId") ?? ""); const parsed = getTransactionInput(formData)
  if (!transactionId) return { error: "We could not find that transaction." }
  if ("error" in parsed) return parsed
  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, userId: user.id, type: { in: ["INCOME", "EXPENSE"] } }, select: { id: true, type: true, amount: true, sourceAccountId: true } })
  if (!existing) return { error: "This transaction is no longer available." }
  const { account, category } = await validateReferences(user.id, parsed.data)
  if (!account) return { error: "Choose an active account." }
  if (!category) return { error: "Choose a matching active category." }
  const previousExpense = existing.type === "EXPENSE" ? existing : undefined
  if (parsed.data.type === "EXPENSE" && !(await canPayExpense(user.id, account.id, parsed.data.amount, previousExpense))) return { error: "This expense is larger than the available account balance." }
  await prisma.transaction.update({ where: { id: existing.id }, data: { type: parsed.data.type, amount: parsed.data.amount, date: parsed.data.date, note: parsed.data.note || null, categoryId: category.id, sourceAccountId: parsed.data.type === "EXPENSE" ? account.id : null, destinationAccountId: parsed.data.type === "INCOME" ? account.id : null } })
  refreshTransactionPages(); return { success: true }
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireUser(); const transactionId = String(formData.get("transactionId") ?? "")
  if (!transactionId) return
  await prisma.transaction.deleteMany({ where: { id: transactionId, userId: user.id, type: { in: ["INCOME", "EXPENSE", "TRANSFER"] } } })
  refreshTransactionPages()
}

function getTransferInput(formData: FormData) {
  const sourceAccountId = String(formData.get("sourceAccountId") ?? "")
  const destinationAccountId = String(formData.get("destinationAccountId") ?? "")
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""))
  const feeAmount = parseMoneyInput(String(formData.get("feeAmount") ?? "0"))
  const date = parseTransactionDate(String(formData.get("date") ?? ""))
  const note = String(formData.get("note") ?? "").trim()
  if (!sourceAccountId || !destinationAccountId || sourceAccountId === destinationAccountId) return { error: "Choose two different active accounts." } as const
  if (amount === null || amount <= 0 || feeAmount === null || feeAmount < 0) return { error: "Enter a valid amount and optional fee." } as const
  if (!date || note.length > 300) return { error: "Choose a valid date and keep the note under 300 characters." } as const
  return { data: { sourceAccountId, destinationAccountId, amount, feeAmount, date, note } } as const
}

async function validateTransferAccounts(userId: string, sourceAccountId: string, destinationAccountId: string) {
  const accounts = await prisma.account.findMany({ where: { id: { in: [sourceAccountId, destinationAccountId] }, userId, isArchived: false }, select: { id: true } })
  return accounts.length === 2
}

export async function createTransferAction(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const user = await requireUser(); const parsed = getTransferInput(formData)
  if ("error" in parsed) return parsed
  if (!(await validateTransferAccounts(user.id, parsed.data.sourceAccountId, parsed.data.destinationAccountId))) return { error: "Choose two active accounts." }
  if (!(await canPayExpense(user.id, parsed.data.sourceAccountId, parsed.data.amount + parsed.data.feeAmount))) return { error: "The source account does not have enough balance for this transfer and fee." }
  await prisma.transaction.create({ data: { type: "TRANSFER", amount: parsed.data.amount, feeAmount: parsed.data.feeAmount, date: parsed.data.date, note: parsed.data.note || null, userId: user.id, sourceAccountId: parsed.data.sourceAccountId, destinationAccountId: parsed.data.destinationAccountId } })
  refreshTransactionPages(); return { success: true }
}

export async function updateTransferAction(_: TransactionFormState, formData: FormData): Promise<TransactionFormState> {
  const user = await requireUser(); const transactionId = String(formData.get("transactionId") ?? ""); const parsed = getTransferInput(formData)
  if (!transactionId) return { error: "We could not find that transfer." }
  if ("error" in parsed) return parsed
  const existing = await prisma.transaction.findFirst({ where: { id: transactionId, userId: user.id, type: "TRANSFER" }, select: { id: true, sourceAccountId: true, amount: true, feeAmount: true } })
  if (!existing) return { error: "This transfer is no longer available." }
  if (!(await validateTransferAccounts(user.id, parsed.data.sourceAccountId, parsed.data.destinationAccountId))) return { error: "Choose two active accounts." }
  const restoredAmount = existing.sourceAccountId === parsed.data.sourceAccountId ? existing.amount + existing.feeAmount : 0
  const currentBalance = await getUserAccountBalance(user.id, parsed.data.sourceAccountId)
  if (currentBalance === null || parsed.data.amount + parsed.data.feeAmount > currentBalance + restoredAmount) return { error: "The source account does not have enough balance for this transfer and fee." }
  await prisma.transaction.update({ where: { id: existing.id }, data: { amount: parsed.data.amount, feeAmount: parsed.data.feeAmount, date: parsed.data.date, note: parsed.data.note || null, sourceAccountId: parsed.data.sourceAccountId, destinationAccountId: parsed.data.destinationAccountId } })
  refreshTransactionPages(); return { success: true }
}
