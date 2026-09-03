"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FolderCog,
  Landmark,
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  Tags,
  WalletCards,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { mainNavigation, utilityNavigation } from "@/config/navigation"
import type { NavigationIcon, NavigationItem } from "@/types/navigation"
import { cn } from "@/lib/utils"

const icons: Record<NavigationIcon, typeof LayoutDashboard> = {
  BarChart3,
  FolderCog,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Tags,
  WalletCards,
}

type NavigationLinksProps = {
  compact?: boolean
  onNavigate?: () => void
}

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href)
}

function NavigationLink({ item, compact, onNavigate }: { item: NavigationItem; compact?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const Icon = icons[item.icon]
  const isActive = isActiveRoute(pathname, item.href)

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        compact && "justify-center px-2",
      )}
      aria-current={isActive ? "page" : undefined}
      title={compact ? item.label : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!compact && <span>{item.label}</span>}
    </Link>
  )
}

export function NavigationLinks({ compact = false, onNavigate }: NavigationLinksProps) {
  return (
    <nav aria-label="Main navigation" className="grid gap-1">
      {mainNavigation.map((item) => <NavigationLink key={item.href} item={item} compact={compact} onNavigate={onNavigate} />)}
      <div className="my-3 border-t" />
      {utilityNavigation.map((item) => <NavigationLink key={item.href} item={item} compact={compact} onNavigate={onNavigate} />)}
    </nav>
  )
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open navigation menu">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-4">
        <SheetHeader className="mb-6">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <NavigationLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

export function MobileBottomNavigation() {
  const pathname = usePathname()
  const items = mainNavigation.slice(0, 5)

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-1 py-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const Icon = icons[item.icon]
        const isActive = isActiveRoute(pathname, item.href)

        return (
          <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-md py-1 text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")} aria-current={isActive ? "page" : undefined}>
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
