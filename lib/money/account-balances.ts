import "server-only"

import { prisma } from "@/lib/db/prisma"
import { getAccountBalance } from "@/lib/money/balance"

export async function getUserAccountBalances(userId: string) {
  const [accounts, transactions] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: {
        type: true,
        amount: true,
        feeAmount: true,
        sourceAccountId: true,
        destinationAccountId: true,
      },
    }),
  ])

  return accounts.map((account) => ({
    ...account,
    balance: getAccountBalance(account.openingBalance, account.id, transactions),
  }))
}

export async function getUserAccountBalance(userId: string, accountId: string) {
  const accounts = await getUserAccountBalances(userId)
  return accounts.find((account) => account.id === accountId)?.balance ?? null
}
