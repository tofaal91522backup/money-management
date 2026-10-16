import { appConfig } from "@/config/app"

export const MONEY_SCALE = 100

// Node and browsers ship different ICU data, so the server prints "BDT 0" where the client prints "0৳".
// Pin the symbol so both sides render identical text.
const currencySymbols: Record<string, string> = { BDT: "৳" }

export function formatMoney(amount: number, options?: { currency?: string; locale?: string }) {
  const currency = options?.currency ?? appConfig.currency
  const parts = new Intl.NumberFormat(options?.locale ?? appConfig.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).formatToParts(amount / MONEY_SCALE)
  const symbol = currencySymbols[currency]
  return parts.map((part) => (part.type === "currency" && symbol ? symbol : part.value)).join("")
}

export function toMinorUnits(amount: number) {
  return Math.round(amount * MONEY_SCALE)
}

export function fromMinorUnits(amount: number) {
  return amount / MONEY_SCALE
}

export function parseMoneyInput(value: string) {
  const normalized = value.trim().replaceAll(",", "")

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const [whole, fraction = ""] = normalized.split(".")
  const amount = Number(whole) * MONEY_SCALE + Number(fraction.padEnd(2, "0"))

  return Number.isSafeInteger(amount) ? amount : null
}
