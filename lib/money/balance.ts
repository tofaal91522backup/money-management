type LedgerTransaction = {
  type: string
  amount: number
  feeAmount: number
  sourceAccountId: string | null
  destinationAccountId: string | null
}

export function getAccountBalance(openingBalance: number, accountId: string, transactions: LedgerTransaction[]) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "INCOME" && transaction.destinationAccountId === accountId) {
      return balance + transaction.amount
    }

    if (transaction.type === "EXPENSE" && transaction.sourceAccountId === accountId) {
      return balance - transaction.amount
    }

    if (transaction.type === "TRANSFER") {
      if (transaction.sourceAccountId === accountId) return balance - transaction.amount - transaction.feeAmount
      if (transaction.destinationAccountId === accountId) return balance + transaction.amount
    }

    if ((transaction.type === "LOAN_DISBURSEMENT" || transaction.type === "LOAN_REPAYMENT") && transaction.sourceAccountId === accountId) {
      return balance - transaction.amount
    }

    if ((transaction.type === "LOAN_DISBURSEMENT" || transaction.type === "LOAN_REPAYMENT") && transaction.destinationAccountId === accountId) {
      return balance + transaction.amount
    }

    return balance
  }, openingBalance)
}
