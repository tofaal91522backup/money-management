import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex min-h-64 min-w-0 flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-4 py-12 text-center sm:px-6", className)}>
      {Icon && <div className="mb-4 rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-5" aria-hidden="true" /></div>}
      <h3 className="max-w-full font-semibold tracking-tight break-words">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 break-words text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { EmptyState }
