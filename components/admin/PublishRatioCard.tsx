import { CheckCircle2, FileImage, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import PublishRatioChart from './PublishRatioChart'
import { getDashboardStats } from '@/lib/services/dashboardService'

export default async function PublishRatioCard() {
  const stats = await getDashboardStats()
  const draft = stats.images.total - stats.images.published
  const fmt = (n: number) => n.toLocaleString()

  const rows = [
    {
      label: 'Published',
      value: fmt(stats.images.published),
      icon: Globe,
      color: 'text-chart-1',
    },
    {
      label: 'Drafts',
      value: fmt(draft),
      icon: FileImage,
      color: 'text-chart-3',
    },
    {
      label: 'Total',
      value: fmt(stats.images.total),
      icon: CheckCircle2,
      color: 'text-muted-foreground',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publish status</CardTitle>
        <CardDescription>Published vs draft images</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <PublishRatioChart
          published={stats.images.published}
          draft={draft}
        />
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <row.icon className={cn('size-4', row.color)} />
              </div>
              <div className="flex flex-1 items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
