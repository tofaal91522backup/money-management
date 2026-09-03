import "server-only"

import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { routes } from "@/config/navigation"
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { prisma } from "@/lib/db/prisma"

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({
    data: {
      token: hashSessionToken(token),
      expiresAt,
      userId,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  })
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { token: hashSessionToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    return null
  }

  return session.user
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect(routes.login)
  }

  return user
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser()

  if (user) {
    redirect(routes.dashboard)
  }
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    await prisma.session.deleteMany({
      where: { token: hashSessionToken(token) },
    })
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}
