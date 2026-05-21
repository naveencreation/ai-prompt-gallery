'use client'

import { Cell, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const chartConfig = {
  published: {
    label: 'Published',
    color: 'var(--chart-1)',
  },
  draft: {
    label: 'Draft',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

export default function PublishRatioChart({
  published,
  draft,
}: {
  published: number
  draft: number
}) {
  const total = published + draft
  const pct = total > 0 ? Math.round((published / total) * 100) : 0
  const data = [
    { name: 'published', value: published, fill: 'var(--color-published)' },
    { name: 'draft', value: draft, fill: 'var(--color-draft)' },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        No images yet
      </div>
    )
  }

  return (
    <div className="relative mx-auto size-[180px]">
      <ChartContainer config={chartConfig} className="size-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={72}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight">{pct}%</span>
        <span className="text-xs text-muted-foreground">Published</span>
      </div>
    </div>
  )
}
