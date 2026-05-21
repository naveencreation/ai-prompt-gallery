import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { getRecentUploads } from '@/lib/services/dashboardService'

function relativeTime(iso: string): string {
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
        <CardDescription>Last 6 images added to the gallery</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {uploads.map((u, index) => (
          <div key={u.id}>
            {index > 0 && <Separator />}
            <Link
              href="/admin/manage"
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                {u.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.slug}</p>
                <p className="truncate text-xs text-muted-foreground">{u.prompt}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                <Badge
                  variant={u.isPublished ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {u.isPublished ? 'published' : 'draft'}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {relativeTime(u.createdAt)}
                </span>
              </div>
            </Link>
          </div>
        ))}
        {uploads.length === 0 && (
          <div className="p-6">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>No uploads yet</EmptyTitle>
                <EmptyDescription>
                  Once you add your first image, it&apos;ll show up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
