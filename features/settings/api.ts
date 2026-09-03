import type { SettingsData } from "@/features/settings/types"

export async function getSettings(): Promise<SettingsData> {
  const response = await fetch("/api/settings")
  if (!response.ok) throw new Error("We could not load your settings.")
  return response.json() as Promise<SettingsData>
}
