'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface TopTagsChartProps {
  tags: Array<{
    name: string
    slug: string
    count: number
  }>
}

const chartColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function TopTagsChart({ tags }: TopTagsChartProps) {
  if (!tags || tags.length === 0) {
    return <div className="text-sm text-muted-foreground">No tags yet.</div>
  }

  // Create chart data with fill colors
  const chartData = tags.map((tag, idx) => ({
    slug: tag.slug,
    name: tag.name,
    count: tag.count,
    fill: chartColors[idx % chartColors.length],
  }))

  // Create dynamic config
  const chartConfig: ChartConfig = {
    count: {
      label: 'Uses',
    },
    ...Object.fromEntries(
      tags.map((tag, idx) => [
        tag.slug,
        {
          label: tag.name,
          color: chartColors[idx % chartColors.length],
        },
      ])
    ),
  }

  // Calculate trend (compare top tag with average of others)
  const topTagCount = tags[0]?.count || 0
  const avgOthers = tags.length > 1 ? tags.slice(1).reduce((sum, t) => sum + t.count, 0) / (tags.length - 1) : 0
  const trend = avgOthers > 0 ? ((topTagCount - avgOthers) / avgOthers * 100).toFixed(1) : 0

  return (
    <div className="space-y-4">
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{
            left: 80,
          }}
        >
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <XAxis dataKey="count" type="number" hide />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  // Find the tag name from the slug
                  const tag = tags.find((t) => t.slug === value)
                  return tag ? `${tag.name} (${tag.slug})` : value
                }}
                hideLabel={false}
              />
            }
          />
          <Bar dataKey="count" radius={5} />
        </BarChart>
      </ChartContainer>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Top tag trending up by {trend}% <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <div className="leading-none text-muted-foreground">
          Comparing top tag to average of others
        </div>
      </div>
    </div>
  )
}
