"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  FolderCog,
  Landmark,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
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

const primaryTabs = mainNavigation.slice(0, 4)
const overflowItems: readonly NavigationItem[] = [...mainNavigation.slice(4), ...utilityNavigation]

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
        "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        compact && "justify-center px-2",
      )}
      aria-current={isActive ? "page" : undefined}
      title={compact ? item.label : undefined}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {!compact && <span className="truncate">{item.label}</span>}
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
  const [moreOpen, setMoreOpen] = useState(false)
  const isOverflowActive = overflowItems.some((item) => isActiveRoute(pathname, item.href))

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      {primaryTabs.map((item) => {
        const Icon = icons[item.icon]
        const isActive = isActiveRoute(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-0.5 py-1.5 text-[10px] leading-tight font-medium",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="w-full truncate text-center">{item.label}</span>
          </Link>
        )
      })}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-0.5 py-1.5 text-[10px] leading-tight font-medium",
              isOverflowActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-label="More sections"
          >
            <MoreHorizontal className="size-5 shrink-0" aria-hidden="true" />
            <span className="w-full truncate text-center">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>All sections</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1">
            {[...mainNavigation, ...utilityNavigation].map((item) => (
              <NavigationLink key={item.href} item={item} onNavigate={() => setMoreOpen(false)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
