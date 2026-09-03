import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1 ring-inset", {
  variants: {
    variant: {
      default: "bg-primary/10 text-primary ring-primary/15",
      secondary: "bg-secondary text-secondary-foreground ring-border",
      success: "bg-success text-success-foreground ring-success-foreground/15",
      warning: "bg-warning text-warning-foreground ring-warning-foreground/15",
      transfer: "bg-transfer text-transfer-foreground ring-transfer-foreground/15",
      destructive: "bg-destructive/10 text-destructive ring-destructive/15",
      outline: "bg-transparent text-foreground ring-border",
    },
  },
  defaultVariants: { variant: "default" },
})

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
