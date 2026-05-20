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
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Badge
          variant="outline"
          className={cn(
            'gap-1 text-xs font-medium border-transparent',
            isPositive
              ? 'bg-success text-success-foreground'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          <Icon />
          {delta}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}
