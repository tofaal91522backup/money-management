import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { TransactionsHistory } from "@/features/transactions/components/transactions-history"
import { TransferForm } from "@/features/transactions/components/transfer-form"

export default function TransactionsPage() {
  return <PageContainer className="py-6 sm:py-8"><div className="mx-auto max-w-6xl"><div className="mb-6"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Transactions</h1><p className="mt-1 text-sm text-muted-foreground">Record, review, and correct your daily money movement.</p></div><div className="grid items-start gap-6 lg:grid-cols-2"><Card className="min-w-0"><CardHeader><CardTitle>New transaction</CardTitle><CardDescription>Record income or expense.</CardDescription></CardHeader><CardContent><TransactionForm /></CardContent></Card><Card className="min-w-0"><CardHeader><CardTitle>Move money</CardTitle><CardDescription>Transfer between your own accounts without changing total money.</CardDescription></CardHeader><CardContent><TransferForm /></CardContent></Card></div><TransactionsHistory /></div></PageContainer>
}
