import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { getUserAccountBalances } from "@/lib/money/account-balances"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await getUserAccountBalances(user.id)

  return NextResponse.json(accounts.map(({ id, name, type, openingBalance, balance, identifier, color, isArchived }) => ({ id, name, type, openingBalance, balance, identifier, color, isArchived })))
}
