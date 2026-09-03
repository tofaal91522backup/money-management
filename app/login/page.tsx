import { Landmark } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { appConfig } from "@/config/app"
import { LoginForm } from "@/features/auth/components/login-form"
import { redirectIfAuthenticated } from "@/lib/auth/session"

export const metadata = {
  title: "Sign in",
}

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <main className="min-h-svh bg-background py-5 sm:py-8">
      <PageContainer className="flex min-h-[calc(100svh-2.5rem)] flex-col sm:min-h-[calc(100svh-4rem)]">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Landmark className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">{appConfig.name}</span>
          </div>
          <ModeToggle />
        </header>

        <section className="mx-auto flex w-full max-w-md flex-1 items-center py-12 sm:py-16">
          <Card className="w-full shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to manage your money in one secure place.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </main>
  )
}
