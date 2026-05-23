import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTopTags } from '@/lib/services/dashboardService'

export default async function TopTagsCard() {
  const tags = await getTopTags(5)
  const max = tags.length ? Math.max(...tags.map((t) => t.count)) : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top tags</CardTitle>
        <CardDescription>Most used tags across all images.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {tags.map((tag) => {
          const percentage = (tag.count / max) * 100
          return (
            <div key={tag.slug} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{tag.name}</span>
                <Badge variant="secondary" className="text-xs font-semibold">{tag.count}</Badge>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={Math.round(percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )
        })}
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
