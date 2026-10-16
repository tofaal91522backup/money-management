import { PageContainer } from "@/components/layout/page-container"
import { NewTransactionCard } from "@/features/transactions/components/new-transaction-card"
import { TransactionsHistory } from "@/features/transactions/components/transactions-history"

export default function TransactionsPage() {
  return <PageContainer className="py-6 sm:py-8"><div className="mx-auto max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Transactions</h1><p className="mt-1 text-sm text-muted-foreground">Record, review, and correct your daily money movement.</p></div><NewTransactionCard /><TransactionsHistory /></div></PageContainer>
}
