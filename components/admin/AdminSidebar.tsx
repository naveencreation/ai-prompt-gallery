'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, List, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Upload', icon: Upload, href: '/admin/upload' },
  { label: 'Manage', icon: List, href: '/admin/manage' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-full w-16 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
        <Link href="/admin/dashboard" className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-2 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}
