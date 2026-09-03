import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } })
  return NextResponse.json({
    name: user.name,
    email: user.email,
    currency: settings?.currency ?? "BDT",
    locale: settings?.locale ?? "en-BD",
    theme: settings?.theme ?? "SYSTEM",
    hideBalances: settings?.hideBalances ?? false,
    defaultAccountId: settings?.defaultAccountId ?? null,
  })
}
