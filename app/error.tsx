"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-svh place-items-center bg-background px-4"><div className="max-w-md text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive"><AlertTriangle className="size-5" /></span><h1 className="mt-5 text-2xl font-semibold tracking-tight">Something went wrong</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Your data has not been changed. Try loading this area again.</p><Button className="mt-6" onClick={reset}>Try again</Button></div></main>
}
