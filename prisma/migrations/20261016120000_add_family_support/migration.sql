-- Flags income received from family, and expenses paid from it. Additive only: existing rows default to false.
ALTER TABLE "Transaction" ADD COLUMN "isFamilySupport" BOOLEAN NOT NULL DEFAULT false;
