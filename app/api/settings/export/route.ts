import { NextResponse } from "next/server"

import { backupFileName, exportUserDataCsv } from "@/lib/backup/user-data"
import { getCurrentUser } from "@/lib/auth/session"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const csv = await exportUserDataCsv(user.id)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${backupFileName()}"`,
      "Cache-Control": "no-store",
    },
  })
}
