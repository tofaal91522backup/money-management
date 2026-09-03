export type AppRoute = `/${string}`

export type NavigationItem = {
  label: string
  href: AppRoute
  icon: NavigationIcon
}

export type NavigationIcon =
  | "BarChart3"
  | "FolderCog"
  | "Landmark"
  | "LayoutDashboard"
  | "ReceiptText"
  | "Settings"
  | "Tags"
  | "WalletCards"
