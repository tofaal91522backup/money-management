import { appConfig } from "@/config/app"

export const MONEY_SCALE = 100

export function formatMoney(amount: number, options?: { currency?: string; locale?: string }) {
  return new Intl.NumberFormat(options?.locale ?? appConfig.locale, {
    style: "currency",
    currency: options?.currency ?? appConfig.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / MONEY_SCALE)
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
