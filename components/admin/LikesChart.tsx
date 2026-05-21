'use client'

import { useId } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { LikesPoint } from '@/lib/services/dashboardService'

const chartConfig = {
  likes: {
    label: 'Likes',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function formatDay(day: string) {
  const d = new Date(day)
  if (Number.isNaN(d.getTime())) return day
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function LikesChart({ data }: { data: LikesPoint[] }) {
  const gradientId = useId().replace(/:/g, '')
  const hasActivity = data.some((d) => d.likes > 0)
  const maxLikes = Math.max(...data.map((d) => d.likes), 0)

  if (!hasActivity) {
    return (
      <div className="flex h-[260px] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 text-center">
        <p className="text-sm font-medium">No likes in this period</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Likes will appear here once visitors engage with your gallery.
        </p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-likes)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--color-likes)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={formatDay}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          allowDecimals={false}
          domain={[0, Math.max(maxLikes, 4)]}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="likes"
          fill={`url(#${gradientId})`}
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  )
}
