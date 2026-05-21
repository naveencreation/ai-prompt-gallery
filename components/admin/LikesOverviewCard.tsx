import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import LikesChart from './LikesChart'
import { getDashboardStats, getLikesTimeseries } from '@/lib/services/dashboardService'

function formatDelta(delta: number): string | null {
  if (delta === 0) return null
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}%`
}

export default async function LikesOverviewCard() {
  const [stats, data] = await Promise.all([
    getDashboardStats(),
    getLikesTimeseries(28),
  ])

  const fmt = (n: number) => n.toLocaleString()
  const periodTotal = data.reduce((sum, p) => sum + p.likes, 0)
  const daysWithData = data.length || 1
  const avgPerDay = Math.round((periodTotal / daysWithData) * 10) / 10
  const peakDay = data.reduce(
    (best, p) => (p.likes > best.likes ? p : best),
    data[0] ?? { day: '', likes: 0 }
  )

  const isPositive = stats.likes.delta >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const deltaLabel = formatDelta(stats.likes.delta)

  const sidebarMetrics = [
    {
      label: 'Last 7 days',
      value: fmt(stats.likes.last7d),
      progress:
        periodTotal > 0
          ? Math.min(100, Math.round((stats.likes.last7d / periodTotal) * 100))
          : 0,
    },
    {
      label: 'Daily average',
      value: String(avgPerDay),
      progress:
        peakDay.likes > 0
          ? Math.min(100, Math.round((avgPerDay / peakDay.likes) * 100))
          : 0,
    },
    {
      label: 'All-time total',
      value: fmt(stats.likes.total),
      progress: 100,
    },
  ]

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b">
        <CardTitle>Likes overview</CardTitle>
        <CardDescription>Daily likes over the last 28 days</CardDescription>
        <CardAction>
          <Badge variant="secondary" className="font-normal">
            28 days
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Likes in period</p>
            <p className="text-4xl font-bold tracking-tight tabular-nums">
              {fmt(periodTotal)}
            </p>
          </div>
          {deltaLabel && (
            <Badge
              variant="outline"
              className={cn(
                'mb-1 gap-1 border-transparent text-xs font-medium',
                isPositive
                  ? 'bg-success text-success-foreground'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              <TrendIcon data-icon="inline-start" />
              {deltaLabel}
            </Badge>
          )}
          {peakDay.likes > 0 && (
            <p className="mb-1 text-xs text-muted-foreground">
              Peak day: {fmt(peakDay.likes)} likes
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(180px,220px)]">
          <LikesChart data={data} />
          <div className="flex flex-col gap-4 lg:border-l lg:pl-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Breakdown
            </p>
            {sidebarMetrics.map((m, i) => (
              <div key={m.label} className="flex flex-col gap-2">
                {i > 0 && <Separator className="lg:hidden" />}
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold tabular-nums">{m.value}</span>
                </div>
                <Progress value={m.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
