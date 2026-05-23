'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [heroMounted, setHeroMounted] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setHeroMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error ?? 'Login failed')
        setLoading(false)
        return
      }
      router.push('/admin/dashboard')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <Card className="overflow-hidden rounded-xl shadow-md">
        <CardContent className="grid grid-cols-1 md:grid-cols-[420px_1fr] p-0">
          {/* Left: Form Column */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <h1 className="text-3xl font-heading font-semibold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access the admin panel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" aria-live="polite">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium">Password</Label>
                  <a href="#" className="text-xs text-muted-foreground hover:underline">Forgot password?</a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {error && <div role="alert" className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</div>}

              <Button type="submit" className="w-full mt-6" disabled={loading} aria-busy={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" type="button" size="sm" aria-label="Sign in with Apple">
                  <span className="text-sm">⌘</span>
                </Button>
                <Button variant="outline" type="button" size="sm" aria-label="Sign in with Google">
                  <span className="text-sm">G</span>
                </Button>
                <Button variant="outline" type="button" size="sm" aria-label="Sign in with Meta">
                  <span className="text-sm">f</span>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-4">
                Need access?{' '}
                <a href="#" className="font-medium text-primary hover:underline">
                  Contact the project owner
                </a>
              </p>
            </form>
          </div>

          {/* Right: Hero Panel */}
          <div
            className={cn(
              'hidden md:flex items-center justify-center p-10 bg-gradient-to-br from-primary/5 via-background to-background',
              'transition-all duration-700 ease-out',
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
              'motion-safe:duration-700 motion-reduce:duration-0'
            )}
          >
            <div className="max-w-xs text-center">
              <h2 className="text-4xl font-heading font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Just Prompt
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                Craft prompts that spark the next idea — concise, clear, powerful.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm
