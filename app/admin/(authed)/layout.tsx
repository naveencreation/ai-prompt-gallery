import { redirect } from 'next/navigation'
import { createRouteClient } from '@/lib/db/client'
import { isAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const client = await createRouteClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    redirect('/admin/login')
  }

  if (!isAdmin(user)) {
    redirect('/admin/login?error=forbidden')
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminTopbar email={user.email ?? 'admin@example.com'} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
