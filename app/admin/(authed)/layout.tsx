import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createRouteClient } from '@/lib/db/client'
import LogoutButton from '@/components/admin/LogoutButton'

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const client = await createRouteClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <span className="text-muted-foreground font-semibold tracking-tight">Prompt Gallery</span>
          <Link href="/admin/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/admin/upload" className="hover:text-foreground transition-colors">Upload</Link>
          <Link href="/admin/manage" className="hover:text-foreground transition-colors">Manage</Link>
          <Link href="/admin/settings" className="hover:text-foreground transition-colors">Settings</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
