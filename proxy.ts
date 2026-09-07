import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"

const PUBLIC_PATHS = new Set(["/login"])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME)

  if (!PUBLIC_PATHS.has(pathname) && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)"],
}
