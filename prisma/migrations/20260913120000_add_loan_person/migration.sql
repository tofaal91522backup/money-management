-- Groups loans under a reusable person, so one person can hold many entries.
-- Every statement here is additive: no row is deleted and no table is rebuilt.
-- `Loan.personName` / `Loan.personContact` stay in place as a snapshot, so this
-- migration is recoverable even if the grouping below turns out to be wrong.

-- CreateTable
CREATE TABLE "LoanPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "note" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "LoanPerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LoanPerson_userId_isArchived_idx" ON "LoanPerson"("userId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "LoanPerson_userId_name_key" ON "LoanPerson"("userId", "name");

-- AlterTable
-- SQLite allows ADD COLUMN with a foreign key as long as the default is NULL,
-- which keeps every existing Loan row exactly where it is.
ALTER TABLE "Loan" ADD COLUMN "personId" TEXT REFERENCES "LoanPerson" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Loan_personId_idx" ON "Loan"("personId");

-- Backfill: one person per distinct name, matched case-insensitively on the
-- trimmed name so "Raaj CSE" and "Raaj cse" become one person. The spelling and
-- contact kept are the ones from that person's oldest loan.
INSERT INTO "LoanPerson" ("id", "name", "contact", "note", "isArchived", "createdAt", "updatedAt", "userId")
SELECT
    'c' || lower(hex(randomblob(12))),
    (SELECT s."personName" FROM "Loan" s
      WHERE s."userId" = l."userId" AND lower(trim(s."personName")) = lower(trim(l."personName"))
      ORDER BY s."createdAt", s."id" LIMIT 1),
    (SELECT s."personContact" FROM "Loan" s
      WHERE s."userId" = l."userId" AND lower(trim(s."personName")) = lower(trim(l."personName"))
        AND s."personContact" IS NOT NULL AND trim(s."personContact") <> ''
      ORDER BY s."createdAt", s."id" LIMIT 1),
    NULL,
    false,
    MIN(l."createdAt"),
    MIN(l."createdAt"),
    l."userId"
FROM "Loan" l
GROUP BY l."userId", lower(trim(l."personName"));

-- Link every existing loan to the person the backfill just created for it.
UPDATE "Loan" SET "personId" = (
    SELECT p."id" FROM "LoanPerson" p
     WHERE p."userId" = "Loan"."userId"
       AND lower(trim(p."name")) = lower(trim("Loan"."personName"))
)
WHERE "personId" IS NULL;
