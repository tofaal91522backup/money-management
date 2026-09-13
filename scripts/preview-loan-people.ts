import "dotenv/config"

/**
 * Read-only preview of the loan person backfill.
 *
 * Runs the exact grouping the migration uses, against whichever database the
 * app itself talks to, and prints the people it would create. Nothing is
 * written, so this is safe to run against production before migrating.
 */

const GROUPING_SQL = `
  SELECT
    (SELECT s.personName FROM Loan s
      WHERE s.userId = l.userId AND lower(trim(s.personName)) = lower(trim(l.personName))
      ORDER BY s.createdAt, s.id LIMIT 1) AS name,
    (SELECT s.personContact FROM Loan s
      WHERE s.userId = l.userId AND lower(trim(s.personName)) = lower(trim(l.personName))
        AND s.personContact IS NOT NULL AND trim(s.personContact) <> ''
      ORDER BY s.createdAt, s.id LIMIT 1) AS contact,
    COUNT(*) AS entries,
    SUM(CASE WHEN l.type = 'RECEIVABLE' THEN 1 ELSE 0 END) AS receivable,
    SUM(CASE WHEN l.type = 'PAYABLE' THEN 1 ELSE 0 END) AS payable,
    COUNT(DISTINCT l.personName) AS spellings,
    GROUP_CONCAT(DISTINCT l.personName) AS variants
  FROM Loan l
  GROUP BY l.userId, lower(trim(l.personName))
  ORDER BY name
`

const COUNTS_SQL = `
  SELECT
    (SELECT COUNT(*) FROM Loan) AS loans,
    (SELECT COUNT(*) FROM LoanRepayment) AS repayments,
    (SELECT COUNT(*) FROM "Transaction" WHERE loanId IS NOT NULL) AS loanTransactions,
    (SELECT COUNT(*) FROM Loan WHERE trim(personName) = '') AS namelessLoans
`

type Row = Record<string, unknown>

async function readRows(sql: string): Promise<Row[]> {
  const tursoUrl = process.env.TURSO_DATABASE_URL

  if (tursoUrl) {
    const { createClient } = await import("@libsql/client")
    const client = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    const result = await client.execute(sql)
    return result.rows as unknown as Row[]
  }

  const { default: Database } = await import("better-sqlite3")
  const file = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, "")
  return new Database(file, { readonly: true }).prepare(sql).all() as Row[]
}

async function main() {
  const target = process.env.TURSO_DATABASE_URL ? "Turso (live)" : (process.env.DATABASE_URL ?? "file:./prisma/dev.db")
  console.log(`\nLoan person backfill preview — ${target}\n`)

  const [counts] = await readRows(COUNTS_SQL)
  const people = await readRows(GROUPING_SQL)

  console.table(
    people.map((person) => ({
      person: person.name,
      contact: person.contact ?? "",
      entries: person.entries,
      receivable: person.receivable,
      payable: person.payable,
      "merged spellings": Number(person.spellings) > 1 ? String(person.variants) : "",
    })),
  )

  const merged = people.filter((person) => Number(person.spellings) > 1)
  console.log(`People to create: ${people.length}`)
  console.log(`Loans to link:    ${counts.loans} (all of them; none stay unlinked)`)
  console.log(`Untouched:        ${counts.repayments} repayments, ${counts.loanTransactions} loan transactions — balances do not move`)
  if (Number(counts.namelessLoans) > 0) console.log(`Loans with a blank person name: ${counts.namelessLoans} — these group into one unnamed person`)
  if (merged.length > 0) {
    console.log(`\nName spellings merged case-insensitively:`)
    for (const person of merged) console.log(`  ${String(person.variants).split(",").join("  +  ")}   ->   ${person.name}`)
  }
  console.log("\nNothing was written. Run the migration to apply this grouping.\n")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
