import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background p-4">
      <div className="mb-6 flex items-center gap-2 text-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">Prompt Gallery</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
