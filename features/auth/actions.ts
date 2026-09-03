"use server"

import { redirect } from "next/navigation"

import { routes } from "@/config/navigation"
import { prisma } from "@/lib/db/prisma"
import { verifyPassword } from "@/lib/auth/password"
import { createSession, deleteCurrentSession } from "@/lib/auth/session"

export type LoginFormState = {
  error?: string
  email?: string
}

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password.", email }
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  const isValidPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : false

  if (!isValidPassword || !user) {
    return { error: "Your email or password is incorrect.", email }
  }

  await createSession(user.id)
  redirect(routes.dashboard)
}

export async function logoutAction() {
  await deleteCurrentSession()
  redirect(routes.login)
}
