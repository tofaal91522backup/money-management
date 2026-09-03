import type { DashboardData } from "@/features/dashboard/types"
export async function getDashboard(): Promise<DashboardData> { const response = await fetch("/api/dashboard"); if (!response.ok) throw new Error("We could not load your dashboard."); return response.json() as Promise<DashboardData> }
