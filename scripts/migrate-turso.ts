import "dotenv/config"

import { createHash, randomUUID } from "crypto"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Applies pending Prisma migrations to the Turso database.
 *
 * `prisma migrate deploy` only reaches the local SQLite file, because the
 * datasource url points there. This runs the same migration files against
 * Turso and records them in `_prisma_migrations` exactly like Prisma does, so
 * the two stay in step and no migration is ever applied twice.
 *
 * Without `--apply` it only reports what is pending. With `--apply` it writes
 * a JSON snapshot of the loan tables first, then runs each migration as one
 * atomic batch.
 */

const MIGRATIONS_DIR = "prisma/migrations"

/**
 * Splits a migration file into single statements, because Turso rejects a
 * multi-statement string. Comments are dropped rather than passed through: an
 * apostrophe inside one (`person's loan`) would otherwise read as the start of
 * a string literal and swallow the following statement separators.
 */
function splitStatements(sql: string) {
  const statements: string[] = []
  let current = ""
  let inString = false
  let inLineComment = false
  let inBlockComment = false

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index]
    const next = sql[index + 1]

    if (inLineComment) {
      if (character === "\n") {
        inLineComment = false
        current += character
      }
      continue
    }

    if (inBlockComment) {
      if (character === "*" && next === "/") {
        inBlockComment = false
        index += 1
      }
      continue
    }

    if (!inString && character === "-" && next === "-") {
      inLineComment = true
      index += 1
      continue
    }

    if (!inString && character === "/" && next === "*") {
      inBlockComment = true
      index += 1
      continue
    }

    if (character === "'") inString = !inString

    if (character === ";" && !inString) {
      if (current.trim()) statements.push(current.trim())
      current = ""
      continue
    }

    current += character
  }

  if (current.trim()) statements.push(current.trim())
  return statements
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url || !authToken) throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.")

  const { createClient } = await import("@libsql/client")
  const client = createClient({ url, authToken })

  const applied = await client.execute("SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL")
  const appliedNames = new Set(applied.rows.map((row) => String(row.migration_name)))

  const pending = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !appliedNames.has(entry.name))
    .map((entry) => entry.name)
    .sort()

  if (pending.length === 0) {
    console.log("\nTurso is up to date — no pending migrations.\n")
    return
  }

  console.log(`\nPending migrations for Turso:\n${pending.map((name) => `  - ${name}`).join("\n")}\n`)

  if (process.argv.includes("--print")) {
    for (const name of pending) {
      const statements = splitStatements(readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"))
      console.log(`${name} — ${statements.length} statements:`)
      statements.forEach((statement, index) => console.log(`\n  [${index + 1}] ${statement.replace(/\s+/g, " ").slice(0, 160)}`))
      console.log("")
    }
  }

  if (!process.argv.includes("--apply")) {
    console.log("Dry run. Re-run with --apply to write these to the live database.\n")
    return
  }

  const snapshot = {
    takenAt: new Date().toISOString(),
    loans: (await client.execute("SELECT * FROM Loan")).rows,
    repayments: (await client.execute("SELECT * FROM LoanRepayment")).rows,
    loanTransactions: (await client.execute('SELECT * FROM "Transaction" WHERE loanId IS NOT NULL')).rows,
  }
  const snapshotFile = `turso-loan-snapshot-${Date.now()}.json`
  writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2))
  console.log(`Snapshot written to ${snapshotFile} (${snapshot.loans.length} loans, ${snapshot.repayments.length} repayments, ${snapshot.loanTransactions.length} transactions).`)

  for (const name of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8")
    const statements = splitStatements(sql)
    const startedAt = Date.now()

    await client.batch(statements, "write")

    await client.execute({
      sql: "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)",
      args: [randomUUID(), createHash("sha256").update(sql).digest("hex"), Date.now(), name, startedAt, statements.length],
    })

    console.log(`Applied ${name} (${statements.length} statements).`)
  }

  console.log("\nDone.\n")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
