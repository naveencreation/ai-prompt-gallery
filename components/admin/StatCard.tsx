import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StatCard({
  label,
  value,
  footer,
  delta,
  trend = 'up',
}: {
  label: string
  value: string
  footer?: string
  delta?: string | null
  trend?: 'up' | 'down'
}) {
  const isPositive = trend === 'up'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const showDelta = delta != null && delta !== ''

  return (
    <Card className="flex min-h-[108px] flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-sm">{label}</CardDescription>
          {showDelta && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 gap-1 border-transparent text-xs font-medium',
                isPositive
                  ? 'bg-success text-success-foreground'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              <TrendIcon data-icon="inline-start" />
              {delta}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-1 pt-2">
        <div className="text-3xl font-bold tracking-tight tabular-nums lg:text-4xl">
          {value}
        </div>
        {footer && (
          <p className="text-xs text-muted-foreground">{footer}</p>
        )}
      </CardContent>
    </Card>
  )
}
