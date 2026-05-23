import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StatCard({
  label,
  value,
  delta,
  trend = 'up',
}: {
  label: string
  value: string
  delta: string
  trend?: 'up' | 'down'
}) {
  const isPositive = trend === 'up'
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Badge
          variant="outline"
          className={cn(
            'gap-1 text-xs font-semibold border-transparent shrink-0',
            isPositive
              ? 'bg-success/15 text-success dark:bg-success/25'
              : 'bg-destructive/15 text-destructive dark:bg-destructive/25'
          )}
        >
          <Icon className="h-3 w-3" />
          {delta}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tighter">{value}</div>
      </CardContent>
    </Card>
  )
}
