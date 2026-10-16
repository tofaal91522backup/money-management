import { PageContainer } from "@/components/layout/page-container"
import { AccountTransactions } from "@/features/accounts/components/account-transactions"

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PageContainer className="py-6 sm:py-8"><AccountTransactions accountId={id} /></PageContainer>
}
