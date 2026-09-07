export type ThemePreference = "SYSTEM" | "LIGHT" | "DARK"

export type SettingsData = {
  name: string | null
  email: string
  currency: string
  locale: string
  theme: ThemePreference
  hideBalances: boolean
  defaultAccountId: string | null
}

export type SettingsFormState = {
  error?: string
  success?: boolean
  savedTheme?: ThemePreference
}

export type ResetDataFormState = {
  error?: string
  success?: boolean
}

export const settingsQueryKey = ["settings"] as const

export type ImportSummary = {
  accounts: number
  categories: number
  loans: number
  repayments: number
  transactions: number
  budgets: number
}

export type ImportDataFormState = {
  error?: string
  summary?: ImportSummary
}

export const exportDataPath = "/api/settings/export"
