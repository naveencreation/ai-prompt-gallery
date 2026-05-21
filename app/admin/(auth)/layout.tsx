import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex items-center gap-2 text-foreground">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">Prompt Gallery</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
