"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const sheetVariants = cva("fixed z-50 flex flex-col gap-4 overflow-y-auto overscroll-contain bg-background p-5 shadow-xl outline-none transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300", {
  variants: {
    side: {
      right: "inset-y-0 right-0 h-dvh w-4/5 max-w-sm border-l pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      left: "inset-y-0 left-0 h-dvh w-4/5 max-w-sm border-r pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
      top: "inset-x-0 top-0 max-h-dvh border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
      bottom: "inset-x-0 bottom-0 max-h-dvh rounded-t-xl border-t pb-[max(1.25rem,env(safe-area-inset-bottom))] data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    },
  },
  defaultVariants: { side: "right" },
})

function SheetContent({ side, className, children, ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute top-3.5 right-3.5 z-10 grid size-8 place-items-center rounded-md bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-col gap-1.5 pr-10", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-lg font-semibold tracking-tight break-words", className)} {...props} />
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-sm leading-6 text-muted-foreground break-words", className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger }
