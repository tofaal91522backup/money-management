import "server-only"

import { randomUUID } from "crypto"

import {
  AccountType,
  BudgetScope,
  CategoryType,
  LoanStatus,
  LoanType,
  ThemePreference,
  TransactionType,
} from "@/generated/prisma/enums"
import { CSV_BOM, parseCsv, toCsv } from "@/lib/backup/csv"
import { prisma } from "@/lib/db/prisma"
import { fromMinorUnits, toMinorUnits } from "@/lib/money/currency"

export const BACKUP_FORMAT_VERSION = "1"

/**
 * Every entity lives in one CSV file. The `record` column says which entity a
 * row describes; the remaining columns are the union of the fields each entity
 * needs, so unrelated cells stay empty. Money is written in major units with
 * two decimals, which round-trips exactly against the integer minor units the
 * database stores.
 */
export const backupColumns = [
  "record",
  "version",
  "id",
  "createdAt",
  "name",
  "type",
  "amount",
  "feeAmount",
  "date",
  "note",
  "icon",
  "color",
  "isArchived",
  "isDefault",
  "openingBalance",
  "identifier",
  "categoryId",
  "sourceAccountId",
  "destinationAccountId",
  "loanId",
  "repaymentId",
  "accountId",
  "personName",
  "personContact",
  "originalAmount",
  "startDate",
  "dueDate",
  "status",
  "originAccountId",
  "scope",
  "month",
  "currency",
  "locale",
  "theme",
  "hideBalances",
  "defaultAccountId",
] as const

type BackupColumn = (typeof backupColumns)[number]
type RecordKind = "meta" | "account" | "category" | "loan" | "loanRepayment" | "transaction" | "budget" | "settings"
type CellValues = Partial<Record<Exclude<BackupColumn, "record">, string>>

export type ImportSummary = {
  accounts: number
  categories: number
  loans: number
  repayments: number
  transactions: number
  budgets: number
}

export class BackupFormatError extends Error {}

const money = (amount: number) => fromMinorUnits(amount).toFixed(2)
const flag = (value: boolean) => (value ? "true" : "false")
const stamp = (value: Date) => value.toISOString()

export function backupFileName(now = new Date()) {
  return `money-management-backup-${now.toISOString().slice(0, 10)}.csv`
}

export async function exportUserDataCsv(userId: string) {
  const [accounts, categories, loans, repayments, transactions, budgets, settings] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.loan.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.loanRepayment.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ])

  const rows: string[][] = [[...backupColumns]]
  const push = (record: RecordKind, values: CellValues) => {
    rows.push(backupColumns.map((column) => (column === "record" ? record : (values[column] ?? ""))))
  }

  push("meta", { version: BACKUP_FORMAT_VERSION, date: stamp(new Date()) })

  for (const account of accounts) {
    push("account", {
      id: account.id,
      createdAt: stamp(account.createdAt),
      name: account.name,
      type: account.type,
      openingBalance: money(account.openingBalance),
      identifier: account.identifier ?? "",
      icon: account.icon ?? "",
      color: account.color ?? "",
      isArchived: flag(account.isArchived),
    })
  }

  for (const category of categories) {
    push("category", {
      id: category.id,
      createdAt: stamp(category.createdAt),
      name: category.name,
      type: category.type,
      icon: category.icon ?? "",
      color: category.color ?? "",
      isDefault: flag(category.isDefault),
      isArchived: flag(category.isArchived),
    })
  }

  for (const loan of loans) {
    push("loan", {
      id: loan.id,
      createdAt: stamp(loan.createdAt),
      type: loan.type,
      personName: loan.personName,
      personContact: loan.personContact ?? "",
      originalAmount: money(loan.originalAmount),
      startDate: stamp(loan.startDate),
      dueDate: loan.dueDate ? stamp(loan.dueDate) : "",
      note: loan.note ?? "",
      status: loan.status,
      originAccountId: loan.originAccountId,
    })
  }

  for (const repayment of repayments) {
    push("loanRepayment", {
      id: repayment.id,
      createdAt: stamp(repayment.createdAt),
      amount: money(repayment.amount),
      date: stamp(repayment.date),
      note: repayment.note ?? "",
      loanId: repayment.loanId,
      accountId: repayment.accountId,
    })
  }

  for (const transaction of transactions) {
    push("transaction", {
      id: transaction.id,
      createdAt: stamp(transaction.createdAt),
      type: transaction.type,
      amount: money(transaction.amount),
      feeAmount: money(transaction.feeAmount),
      date: stamp(transaction.date),
      note: transaction.note ?? "",
      categoryId: transaction.categoryId ?? "",
      sourceAccountId: transaction.sourceAccountId ?? "",
      destinationAccountId: transaction.destinationAccountId ?? "",
      loanId: transaction.loanId ?? "",
      repaymentId: transaction.repaymentId ?? "",
    })
  }

  for (const budget of budgets) {
    push("budget", {
      id: budget.id,
      createdAt: stamp(budget.createdAt),
      scope: budget.scope,
      amount: money(budget.amount),
      month: stamp(budget.month),
      categoryId: budget.categoryId ?? "",
    })
  }

  if (settings) {
    push("settings", {
      currency: settings.currency,
      locale: settings.locale,
      theme: settings.theme,
      hideBalances: flag(settings.hideBalances),
      defaultAccountId: settings.defaultAccountId ?? "",
    })
  }

  return CSV_BOM + toCsv(rows)
}

type SourceRow = {
  line: number
  kind: string
  value: (column: BackupColumn) => string
}

function readRows(csv: string): SourceRow[] {
  const rows = parseCsv(csv)
  if (rows.length === 0) throw new BackupFormatError("The file is empty.")

  const header = rows[0].map((value) => value.trim())
  const recordIndex = header.indexOf("record")
  if (recordIndex === -1) {
    throw new BackupFormatError("This file has no “record” column, so it is not a Money Management export.")
  }

  const columnIndexes = new Map(header.map((name, index) => [name, index] as const))

  return rows.slice(1).map((cells, offset) => ({
    line: offset + 2,
    kind: (cells[recordIndex] ?? "").trim(),
    value: (column: BackupColumn) => {
      const index = columnIndexes.get(column)
      return index === undefined ? "" : (cells[index] ?? "").trim()
    },
  }))
}

function requireText(row: SourceRow, column: BackupColumn, max = 200) {
  const value = row.value(column)
  if (!value) throw new BackupFormatError(`Row ${row.line}: “${column}” is required for a ${row.kind} row.`)
  if (value.length > max) throw new BackupFormatError(`Row ${row.line}: “${column}” is longer than ${max} characters.`)
  return value
}

function optionalText(row: SourceRow, column: BackupColumn) {
  return row.value(column) || null
}

function requireEnum<T extends Record<string, string>>(row: SourceRow, column: BackupColumn, options: T): T[keyof T] {
  const value = requireText(row, column)
  const allowed = Object.values(options)
  if (!allowed.includes(value)) {
    throw new BackupFormatError(`Row ${row.line}: “${value}” is not a valid ${column}. Expected one of ${allowed.join(", ")}.`)
  }
  return value as T[keyof T]
}

function readMoney(row: SourceRow, column: BackupColumn, { required = true, allowNegative = false } = {}) {
  const value = row.value(column)
  if (!value) {
    if (required) throw new BackupFormatError(`Row ${row.line}: “${column}” is required for a ${row.kind} row.`)
    return 0
  }
  if (!/^-?\d+(\.\d{1,2})?$/.test(value)) {
    throw new BackupFormatError(`Row ${row.line}: “${column}” must be an amount such as 1500 or 1500.50.`)
  }
  const amount = toMinorUnits(Number(value))
  if (!Number.isSafeInteger(amount)) throw new BackupFormatError(`Row ${row.line}: “${column}” is too large.`)
  if (amount < 0 && !allowNegative) throw new BackupFormatError(`Row ${row.line}: “${column}” cannot be negative.`)
  return amount
}

function readDate(row: SourceRow, column: BackupColumn, required = true) {
  const value = row.value(column)
  if (!value) {
    if (required) throw new BackupFormatError(`Row ${row.line}: “${column}” is required for a ${row.kind} row.`)
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new BackupFormatError(`Row ${row.line}: “${value}” is not a valid date. Use a format such as 2026-01-31.`)
  }
  return date
}

function readFlag(row: SourceRow, column: BackupColumn) {
  const value = row.value(column).toLowerCase()
  if (!value) return false
  if (value === "true" || value === "1" || value === "yes") return true
  if (value === "false" || value === "0" || value === "no") return false
  throw new BackupFormatError(`Row ${row.line}: “${column}” must be true or false.`)
}

/**
 * Ids are re-generated on import so a file can be restored into any account,
 * including one that still holds the rows it was exported from. Every
 * cross-reference in the file is rewritten through these maps.
 */
function readCreatedAt(row: SourceRow) {
  return readDate(row, "createdAt", false) ?? new Date()
}

function claimId(map: Map<string, string>, row: SourceRow) {
  const original = requireText(row, "id")
  if (map.has(original)) throw new BackupFormatError(`Row ${row.line}: the id “${original}” appears more than once.`)
  const id = randomUUID()
  map.set(original, id)
  return id
}

function resolveId(map: Map<string, string>, original: string, label: string, row: SourceRow) {
  const id = map.get(original)
  if (!id) throw new BackupFormatError(`Row ${row.line}: no ${label} in this file has the id “${original}”.`)
  return id
}

function requireUnique(seen: Set<string>, key: string, message: string) {
  if (seen.has(key)) throw new BackupFormatError(message)
  seen.add(key)
}

export function readBackupCsv(userId: string, csv: string) {
  const rows = readRows(csv)

  const meta = rows.find((row) => row.kind === "meta")
  const version = meta?.value("version")
  if (version && version !== BACKUP_FORMAT_VERSION) {
    throw new BackupFormatError(`This file uses backup format ${version}, but this app reads format ${BACKUP_FORMAT_VERSION}.`)
  }

  const known: RecordKind[] = ["meta", "account", "category", "loan", "loanRepayment", "transaction", "budget", "settings"]
  const unknown = rows.find((row) => !known.includes(row.kind as RecordKind))
  if (unknown) {
    throw new BackupFormatError(`Row ${unknown.line}: “${unknown.kind || "(blank)"}” is not a known record type.`)
  }

  const accountIds = new Map<string, string>()
  const categoryIds = new Map<string, string>()
  const loanIds = new Map<string, string>()
  const repaymentIds = new Map<string, string>()

  const accountNames = new Set<string>()
  const accounts = rows
    .filter((row) => row.kind === "account")
    .map((row) => {
      const id = claimId(accountIds, row)
      const name = requireText(row, "name", 60)
      requireUnique(accountNames, name.toLowerCase(), `Row ${row.line}: more than one account is named “${name}”.`)
      return {
        id,
        userId,
        createdAt: readCreatedAt(row),
        name,
        type: requireEnum(row, "type", AccountType),
        openingBalance: readMoney(row, "openingBalance", { required: false, allowNegative: true }),
        identifier: optionalText(row, "identifier"),
        icon: optionalText(row, "icon"),
        color: optionalText(row, "color"),
        isArchived: readFlag(row, "isArchived"),
      }
    })

  const categoryNames = new Set<string>()
  const categories = rows
    .filter((row) => row.kind === "category")
    .map((row) => {
      const id = claimId(categoryIds, row)
      const name = requireText(row, "name", 60)
      const type = requireEnum(row, "type", CategoryType)
      requireUnique(categoryNames, `${type}:${name.toLowerCase()}`, `Row ${row.line}: more than one ${type.toLowerCase()} category is named “${name}”.`)
      return {
        id,
        userId,
        createdAt: readCreatedAt(row),
        name,
        type,
        icon: optionalText(row, "icon"),
        color: optionalText(row, "color"),
        isDefault: readFlag(row, "isDefault"),
        isArchived: readFlag(row, "isArchived"),
      }
    })

  const loans = rows
    .filter((row) => row.kind === "loan")
    .map((row) => ({
      id: claimId(loanIds, row),
      userId,
      createdAt: readCreatedAt(row),
      personName: requireText(row, "personName", 80),
      personContact: optionalText(row, "personContact"),
      type: requireEnum(row, "type", LoanType),
      originalAmount: readMoney(row, "originalAmount"),
      startDate: readDate(row, "startDate") as Date,
      dueDate: readDate(row, "dueDate", false),
      note: optionalText(row, "note"),
      status: requireEnum(row, "status", LoanStatus),
      originAccountId: resolveId(accountIds, requireText(row, "originAccountId"), "account", row),
    }))

  const repayments = rows
    .filter((row) => row.kind === "loanRepayment")
    .map((row) => ({
      id: claimId(repaymentIds, row),
      userId,
      createdAt: readCreatedAt(row),
      amount: readMoney(row, "amount"),
      date: readDate(row, "date") as Date,
      note: optionalText(row, "note"),
      loanId: resolveId(loanIds, requireText(row, "loanId"), "loan", row),
      accountId: resolveId(accountIds, requireText(row, "accountId"), "account", row),
    }))

  const linkedRepayments = new Set<string>()
  const transactions = rows
    .filter((row) => row.kind === "transaction")
    .map((row) => {
      const repaymentRef = row.value("repaymentId")
      const repaymentId = repaymentRef ? resolveId(repaymentIds, repaymentRef, "loan repayment", row) : null
      if (repaymentId) {
        requireUnique(linkedRepayments, repaymentId, `Row ${row.line}: repayment “${repaymentRef}” is already linked to another transaction.`)
      }
      const categoryRef = row.value("categoryId")
      const sourceRef = row.value("sourceAccountId")
      const destinationRef = row.value("destinationAccountId")
      const loanRef = row.value("loanId")
      return {
        id: randomUUID(),
        userId,
        createdAt: readCreatedAt(row),
        type: requireEnum(row, "type", TransactionType),
        amount: readMoney(row, "amount"),
        feeAmount: readMoney(row, "feeAmount", { required: false }),
        date: readDate(row, "date") as Date,
        note: optionalText(row, "note"),
        categoryId: categoryRef ? resolveId(categoryIds, categoryRef, "category", row) : null,
        sourceAccountId: sourceRef ? resolveId(accountIds, sourceRef, "account", row) : null,
        destinationAccountId: destinationRef ? resolveId(accountIds, destinationRef, "account", row) : null,
        loanId: loanRef ? resolveId(loanIds, loanRef, "loan", row) : null,
        repaymentId,
      }
    })

  const budgets = rows
    .filter((row) => row.kind === "budget")
    .map((row) => {
      const categoryRef = row.value("categoryId")
      const scope = requireEnum(row, "scope", BudgetScope)
      if (scope === BudgetScope.CATEGORY && !categoryRef) {
        throw new BackupFormatError(`Row ${row.line}: a category budget needs a categoryId.`)
      }
      return {
        id: randomUUID(),
        userId,
        createdAt: readCreatedAt(row),
        scope,
        amount: readMoney(row, "amount"),
        month: readDate(row, "month") as Date,
        categoryId: categoryRef ? resolveId(categoryIds, categoryRef, "category", row) : null,
      }
    })

  const settingsRow = rows.find((row) => row.kind === "settings")
  const defaultAccountRef = settingsRow?.value("defaultAccountId")
  const settings = settingsRow
    ? {
        currency: settingsRow.value("currency") || "BDT",
        locale: settingsRow.value("locale") || "en-BD",
        theme: requireEnum(settingsRow, "theme", ThemePreference),
        hideBalances: readFlag(settingsRow, "hideBalances"),
        defaultAccountId: defaultAccountRef ? resolveId(accountIds, defaultAccountRef, "account", settingsRow) : null,
      }
    : null

  if (accounts.length === 0 && transactions.length === 0 && categories.length === 0) {
    throw new BackupFormatError("This file has no accounts, categories or transactions to import.")
  }

  return { accounts, categories, loans, repayments, transactions, budgets, settings }
}

export async function importUserDataCsv(userId: string, csv: string): Promise<ImportSummary> {
  const data = readBackupCsv(userId, csv)

  await prisma.$transaction(
    async (tx) => {
      await tx.userSettings.updateMany({ where: { userId }, data: { defaultAccountId: null } })
      await tx.transaction.deleteMany({ where: { userId } })
      await tx.loanRepayment.deleteMany({ where: { userId } })
      await tx.loan.deleteMany({ where: { userId } })
      await tx.budget.deleteMany({ where: { userId } })
      await tx.category.deleteMany({ where: { userId } })
      await tx.account.deleteMany({ where: { userId } })

      if (data.accounts.length) await tx.account.createMany({ data: data.accounts })
      if (data.categories.length) await tx.category.createMany({ data: data.categories })
      if (data.loans.length) await tx.loan.createMany({ data: data.loans })
      if (data.repayments.length) await tx.loanRepayment.createMany({ data: data.repayments })
      if (data.transactions.length) await tx.transaction.createMany({ data: data.transactions })
      if (data.budgets.length) await tx.budget.createMany({ data: data.budgets })

      if (data.settings) {
        await tx.userSettings.upsert({
          where: { userId },
          update: data.settings,
          create: { userId, ...data.settings },
        })
      }
    },
    { maxWait: 15_000, timeout: 120_000 },
  )

  return {
    accounts: data.accounts.length,
    categories: data.categories.length,
    loans: data.loans.length,
    repayments: data.repayments.length,
    transactions: data.transactions.length,
    budgets: data.budgets.length,
  }
}
