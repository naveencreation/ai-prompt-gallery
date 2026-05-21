'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, List, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Upload', icon: Upload, href: '/admin/upload' },
  { label: 'Manage', icon: List, href: '/admin/manage' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Link
          href="/admin/dashboard"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <Sparkles data-icon="inline-start" />
        </Link>
        <span className="font-heading text-sm font-semibold tracking-tight">
          Prompt Gallery
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0 opacity-80" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
