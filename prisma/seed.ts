import "dotenv/config"

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from "../generated/prisma/client"
import { hashPassword } from "../lib/auth/password"
import { defaultCategories } from "./default-categories"

const email = process.env.INITIAL_USER_EMAIL
const password = process.env.INITIAL_USER_PASSWORD

if (!email || !password) {
  throw new Error("INITIAL_USER_EMAIL and INITIAL_USER_PASSWORD must be set before seeding.")
}

if (password === "change-this-password" || password === "use-a-strong-password") {
  throw new Error("Set a unique INITIAL_USER_PASSWORD before seeding.")
}

const initialUserEmail = email
const initialUserPassword = password

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
})

async function main() {
  const user = await prisma.user.upsert({
    where: { email: initialUserEmail },
    update: {},
    create: {
      email: initialUserEmail,
      passwordHash: await hashPassword(initialUserPassword),
      settings: { create: {} },
    },
  })

  await Promise.all(
    defaultCategories.map((category) =>
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: category.type,
            name: category.name,
          },
        },
        update: {},
        create: {
          ...category,
          userId: user.id,
          isDefault: true,
        },
      }),
    ),
  )
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
