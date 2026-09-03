import type { ReportData } from "@/features/reports/types"

export async function getReport(month: string): Promise<ReportData> {
  const response = await fetch(`/api/reports?month=${month}`)
  if (!response.ok) throw new Error("We could not load this report.")
  return response.json() as Promise<ReportData>
}
