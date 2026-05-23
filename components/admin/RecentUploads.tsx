import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRecentUploads } from '@/lib/services/dashboardService'

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default async function RecentUploads() {
  const uploads = await getRecentUploads(6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent uploads</CardTitle>
        <CardDescription>Last 6 images added to the gallery.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {uploads.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-all hover:bg-muted/60 hover:shadow-sm hover:border-primary/30 dark:hover:border-primary/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{u.slug}</p>
              <p className="truncate text-xs text-muted-foreground">{u.prompt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Badge variant={u.isPublished ? 'default' : 'secondary'} className="text-xs font-semibold capitalize shrink-0">
                {u.isPublished ? 'published' : 'draft'}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(u.createdAt)}</span>
            </div>
          </div>
        ))}
        {uploads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">No uploads yet</p>
            <p className="text-xs text-muted-foreground mt-1">Get started by uploading your first image</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
