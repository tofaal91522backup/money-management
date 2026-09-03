import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return <main className="mx-auto grid min-h-svh w-full max-w-5xl content-start gap-6 px-4 py-8 sm:px-6"><Skeleton className="h-12 w-64" /><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-36" />)}</div><Skeleton className="h-72" /></main>
}
