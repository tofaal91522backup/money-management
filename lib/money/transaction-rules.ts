export type MoneyTransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "LOAN_DISBURSEMENT"
  | "LOAN_REPAYMENT"

export function affectsIncomeReport(type: MoneyTransactionType) {
  return type === "INCOME"
}

export function affectsExpenseReport(type: MoneyTransactionType) {
  return type === "EXPENSE"
}

export function affectsBudget(type: MoneyTransactionType) {
  return type === "EXPENSE"
}

export function requiresSourceAccount(type: MoneyTransactionType) {
  return type === "EXPENSE" || type === "TRANSFER" || type === "LOAN_DISBURSEMENT" || type === "LOAN_REPAYMENT"
}

export function requiresDestinationAccount(type: MoneyTransactionType) {
  return type === "INCOME" || type === "TRANSFER" || type === "LOAN_DISBURSEMENT" || type === "LOAN_REPAYMENT"
}
