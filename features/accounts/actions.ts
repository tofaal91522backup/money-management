"use server"

import { revalidatePath } from "next/cache"

import { accountTypes, type AccountFormState, type AccountType } from "@/features/accounts/types"
import { requireUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { parseMoneyInput } from "@/lib/money/currency"

function getAccountInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  const type = String(formData.get("type") ?? "") as AccountType
  const openingBalance = parseMoneyInput(String(formData.get("openingBalance") ?? ""))
  const identifier = String(formData.get("identifier") ?? "").trim() || null
  const color = String(formData.get("color") ?? "").trim() || null

  if (name.length < 2 || name.length > 40) {
    return { error: "Account name must be between 2 and 40 characters." } as const
  }

  if (!accountTypes.includes(type)) {
    return { error: "Choose a valid account type." } as const
  }

  if (openingBalance === null) {
    return { error: "Enter a valid opening balance with up to two decimal places." } as const
  }

  return { data: { name, type, openingBalance, identifier, color } } as const
}

function refreshAccountPages() {
  revalidatePath("/")
  revalidatePath("/accounts")
}

export async function createAccountAction(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await requireUser()
  const parsed = getAccountInput(formData)

  if ("error" in parsed) {
    return parsed
  }

  try {
    await prisma.account.create({
      data: {
        ...parsed.data,
        userId: user.id,
      },
    })
  } catch {
    return { error: "An account with this name already exists." }
  }

  refreshAccountPages()
  return { success: true }
}

export async function updateAccountAction(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const user = await requireUser()
  const accountId = String(formData.get("accountId") ?? "")
  const parsed = getAccountInput(formData)

  if (!accountId) {
    return { error: "We could not find that account." }
  }

  if ("error" in parsed) {
    return parsed
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user.id },
    select: { id: true, openingBalance: true, _count: { select: { outgoingTransactions: true, incomingTransactions: true } } },
  })

  if (!account) {
    return { error: "This account is no longer available." }
  }

  const hasTransactions = account._count.outgoingTransactions + account._count.incomingTransactions > 0

  if (hasTransactions && account.openingBalance !== parsed.data.openingBalance) {
    return { error: "Opening balance cannot change after transactions have been added." }
  }

  try {
    await prisma.account.update({
      where: { id: account.id },
      data: parsed.data,
    })
  } catch {
    return { error: "An account with this name already exists." }
  }

  refreshAccountPages()
  return { success: true }
}

export async function toggleAccountArchiveAction(formData: FormData) {
  const user = await requireUser()
  const accountId = String(formData.get("accountId") ?? "")
  const archive = formData.get("archive") === "true"

  if (!accountId) {
    return
  }

  await prisma.account.updateMany({
    where: { id: accountId, userId: user.id },
    data: { isArchived: archive },
  })

  refreshAccountPages()
}
