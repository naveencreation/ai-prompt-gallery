import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { getTopTags } from '@/lib/services/dashboardService'

export default async function TopTagsCard() {
  const tags = await getTopTags(5)
  const max = tags.length ? Math.max(...tags.map((t) => t.count)) : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top tags</CardTitle>
        <CardDescription>Most used tags across all images</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {tags.map((tag, index) => (
          <div key={tag.slug} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-6 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-medium">{tag.name}</span>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                {tag.count}
              </Badge>
            </div>
            <Progress value={(tag.count / max) * 100} />
          </div>
        ))}
        {tags.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No tags yet</EmptyTitle>
              <EmptyDescription>
                Tags appear here once you publish a few images with them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
