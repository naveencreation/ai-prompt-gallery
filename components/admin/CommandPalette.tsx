'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, Upload, List, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Upload', icon: Upload, href: '/admin/upload' },
  { label: 'Manage', icon: List, href: '/admin/manage' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="relative w-full max-w-xs justify-start"
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 text-[10px] font-mono font-medium md:inline-block">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search or jump to..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
              >
                <item.icon data-icon="inline-start" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={async () => {
                await fetch('/api/admin/auth', { method: 'DELETE' })
                router.push('/admin/login')
                setOpen(false)
              }}
            >
              <LogOut data-icon="inline-start" />
              Log out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
