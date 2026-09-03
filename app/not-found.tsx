import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return <main className="grid min-h-svh place-items-center bg-background px-4 text-center"><div><p className="text-sm font-semibold text-primary">404</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1><p className="mt-2 text-sm text-muted-foreground">The page you are looking for does not exist.</p><Button className="mt-6" asChild><Link href="/">Back to dashboard</Link></Button></div></main>
}
