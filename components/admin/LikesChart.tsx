'use client'

import { TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import type { LikesPoint } from '@/lib/services/dashboardService'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const chartConfig = {
  likes: {
    label: 'Likes',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

export default function LikesChart({ data }: { data: LikesPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">No data available</div>
  }

  // Calculate trend (compare last 7 days with previous 7 days)
  const last7 = data.slice(-7).reduce((sum, point) => sum + point.likes, 0)
  const previous7 = data.slice(-14, -7).reduce((sum, point) => sum + point.likes, 0)
  const trend = previous7 > 0 ? ((last7 - previous7) / previous7 * 100).toFixed(1) : 0
  const isTrendingUp = parseFloat(trend as string) >= 0

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              // Format date like "Jan 1" or "Jan"
              try {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              } catch {
                return value
              }
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  try {
                    return new Date(value).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  } catch {
                    return value
                  }
                }}
                indicator="line"
              />
            }
          />
          <Area
            dataKey="likes"
            type="natural"
            fill="var(--color-likes)"
            fillOpacity={0.4}
            stroke="var(--color-likes)"
          />
        </AreaChart>
      </ChartContainer>
      <div className="flex items-start gap-2 text-sm">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 leading-none font-medium">
            {isTrendingUp ? (
              <>
                Trending up by {trend}% <TrendingUp className="h-4 w-4 text-success" />
              </>
            ) : (
              <>
                Trending down by {Math.abs(parseFloat(trend as string))}% <TrendingUp className="h-4 w-4 rotate-180 text-destructive" />
              </>
            )}
          </div>
          <div className="flex items-center gap-2 leading-none text-muted-foreground">
            Last 7 days vs previous 7 days
          </div>
        </div>
      </div>
    </div>
  )
}
