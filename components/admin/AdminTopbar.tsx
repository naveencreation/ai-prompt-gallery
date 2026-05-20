import CommandPalette from './CommandPalette'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

export default function AdminTopbar({ email }: { email: string }) {
  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4">
      <div className="flex flex-1 items-center gap-2">
        <CommandPalette />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
