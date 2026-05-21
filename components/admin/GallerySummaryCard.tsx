import { Heart, Images, Tags, Eye } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getDashboardStats } from '@/lib/services/dashboardService'

export default async function GallerySummaryCard() {
  const stats = await getDashboardStats()
  const fmt = (n: number) => n.toLocaleString()
  const draft = stats.images.total - stats.images.published

  const metrics = [
    { label: 'Total images', value: fmt(stats.images.total), icon: Images },
    { label: 'Published', value: fmt(stats.images.published), icon: Eye },
    { label: 'Drafts', value: fmt(draft), icon: Images },
    { label: 'Active tags', value: fmt(stats.tags.total), icon: Tags },
    { label: 'Total likes', value: fmt(stats.likes.total), icon: Heart },
    { label: 'Likes (7d)', value: fmt(stats.likes.last7d), icon: Heart },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery summary</CardTitle>
        <CardDescription>Key metrics at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-1">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <m.icon className="size-3.5 shrink-0 opacity-70" />
                {m.label}
              </dt>
              <dd className="text-lg font-semibold tabular-nums tracking-tight">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
