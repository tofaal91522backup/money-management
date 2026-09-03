import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: [{ isArchived: "asc" }, { type: "asc" }, { name: "asc" }],
    select: { id: true, name: true, type: true, icon: true, color: true, isDefault: true, isArchived: true },
  })

  return NextResponse.json(categories)
}
