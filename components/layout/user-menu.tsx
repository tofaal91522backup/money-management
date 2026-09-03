"use client"

import { LogOut, UserRound } from "lucide-react"
import { DropdownMenu } from "radix-ui"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { logoutAction } from "@/features/auth/actions"

type UserMenuProps = {
  email: string
  name: string | null
}

export function UserMenu({ email, name }: UserMenuProps) {
  const displayName = name ?? email

  return (
    <div className="flex items-center gap-2">
      <ModeToggle />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="outline" size="icon" aria-label="Open account menu">
            <UserRound className="size-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-56 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
            <div className="border-b px-2.5 py-2.5">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {name && <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>}
            </div>
            <form action={logoutAction}>
              <button type="submit" className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/30">
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
