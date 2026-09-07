import { Landmark } from "lucide-react"
import type { ReactNode } from "react"

import { MobileBottomNavigation, MobileNavigation, NavigationLinks } from "@/components/layout/app-navigation"
import { PageContainer } from "@/components/layout/page-container"
import { UserMenu } from "@/components/layout/user-menu"
import { appConfig } from "@/config/app"

type AppShellProps = {
  children: ReactNode
  user: {
    email: string
    name: string | null
  }
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-svh bg-background md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <a href="#main-content" className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0">Skip to content</a>
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar px-3 py-5 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Landmark className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
        </div>
        <NavigationLinks />
        <div className="mt-auto border-t pt-4">
          <p className="truncate px-2 text-xs font-medium text-muted-foreground">{user.name ?? user.email}</p>
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <PageContainer className="flex h-16 max-w-none items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="md:hidden"><MobileNavigation /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">Your money, at a glance</p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">Keep every account and payment in view.</p>
              </div>
            </div>
            <div className="shrink-0"><UserMenu email={user.email} name={user.name} /></div>
          </PageContainer>
        </header>
        <main id="main-content" tabIndex={-1} className="min-w-0 overflow-x-clip">{children}</main>
      </div>
      <MobileBottomNavigation />
    </div>
  )
}
