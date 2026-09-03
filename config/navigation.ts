import type { AppRoute, NavigationItem } from "@/types/navigation"

export const routes = {
  login: "/login",
  dashboard: "/",
  transactions: "/transactions",
  accounts: "/accounts",
  loans: "/loans",
  budgets: "/budgets",
  reports: "/reports",
  categories: "/categories",
  settings: "/settings",
} as const satisfies Record<string, AppRoute>

export const mainNavigation = [
  { label: "Dashboard", href: routes.dashboard, icon: "LayoutDashboard" },
  { label: "Transactions", href: routes.transactions, icon: "ReceiptText" },
  { label: "Accounts", href: routes.accounts, icon: "WalletCards" },
  { label: "Loans", href: routes.loans, icon: "Landmark" },
  { label: "Budgets", href: routes.budgets, icon: "FolderCog" },
  { label: "Reports", href: routes.reports, icon: "BarChart3" },
  { label: "Categories", href: routes.categories, icon: "Tags" },
] as const satisfies readonly NavigationItem[]

export const utilityNavigation = [
  { label: "Settings", href: routes.settings, icon: "Settings" },
] as const satisfies readonly NavigationItem[]
