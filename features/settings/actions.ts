"use server"

import { revalidatePath } from "next/cache"

import { BackupFormatError, importUserDataCsv } from "@/lib/backup/user-data"
import { requireUser } from "@/lib/auth/session"
import { verifyPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db/prisma"
import { defaultCategories } from "@/prisma/default-categories"
import type { ImportDataFormState, ResetDataFormState, SettingsFormState, ThemePreference } from "@/features/settings/types"

const themes: ThemePreference[] = ["SYSTEM", "LIGHT", "DARK"]

export async function updateSettingsAction(_: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser()
  const name = String(formData.get("name") ?? "").trim() || null
  const theme = String(formData.get("theme") ?? "SYSTEM") as ThemePreference
  const defaultAccountId = String(formData.get("defaultAccountId") ?? "") || null
  const hideBalances = formData.get("hideBalances") === "on"

  if (name && (name.length < 2 || name.length > 60)) {
    return { error: "Your display name must be between 2 and 60 characters." }
  }

  if (!themes.includes(theme)) {
    return { error: "Choose a valid theme preference." }
  }

  if (defaultAccountId) {
    const account = await prisma.account.findFirst({
      where: { id: defaultAccountId, userId: user.id, isArchived: false },
      select: { id: true },
    })
    if (!account) return { error: "Choose an active default account." }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { name } }),
    prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { theme, hideBalances, defaultAccountId },
      create: { userId: user.id, theme, hideBalances, defaultAccountId },
    }),
  ])

  revalidatePath("/", "layout")
  return { success: true, savedTheme: theme }
}

export async function resetAllDataAction(_: ResetDataFormState, formData: FormData): Promise<ResetDataFormState> {
  const user = await requireUser()
  const password = String(formData.get("password") ?? "")

  if (!password) return { error: "Enter your password to confirm the reset." }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "The password is incorrect. No records were deleted." }
  }

  await prisma.$transaction(async (tx) => {
    await tx.userSettings.updateMany({ where: { userId: user.id }, data: { defaultAccountId: null } })
    await tx.transaction.deleteMany({ where: { userId: user.id } })
    await tx.loanRepayment.deleteMany({ where: { userId: user.id } })
    await tx.loan.deleteMany({ where: { userId: user.id } })
    await tx.budget.deleteMany({ where: { userId: user.id } })
    await tx.category.deleteMany({ where: { userId: user.id } })
    await tx.account.deleteMany({ where: { userId: user.id } })
    await tx.category.createMany({
      data: defaultCategories.map((category) => ({ ...category, userId: user.id, isDefault: true })),
    })
  })

  revalidatePath("/", "layout")
  return { success: true }
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export async function importDataAction(_: ImportDataFormState, formData: FormData): Promise<ImportDataFormState> {
  const user = await requireUser()
  const file = formData.get("file")
  const password = String(formData.get("password") ?? "")

  if (!(file instanceof File) || file.size === 0) return { error: "Choose the CSV file you want to import." }
  if (file.size > MAX_IMPORT_BYTES) return { error: "That file is larger than 5 MB." }
  if (!password) return { error: "Enter your password to confirm the import." }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "The password is incorrect. Nothing was imported." }
  }

  try {
    const summary = await importUserDataCsv(user.id, await file.text())
    revalidatePath("/", "layout")
    return { summary }
  } catch (error) {
    if (error instanceof BackupFormatError) return { error: error.message }
    console.error("Data import failed", error)
    return { error: "The import could not be completed, so your existing records were left unchanged." }
  }
}
