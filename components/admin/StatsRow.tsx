import StatCard from './StatCard'
import { getDashboardStats } from '@/lib/services/dashboardService'

function formatDelta(delta: number): string | null {
  if (delta === 0) return null
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta}%`
}

export default async function StatsRow() {
  const stats = await getDashboardStats()
  const fmt = (n: number) => n.toLocaleString()

  const publishedPct =
    stats.images.total > 0
      ? Math.round((stats.images.published / stats.images.total) * 100)
      : 0

  const likesDelta = formatDelta(stats.likes.delta)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total images" value={fmt(stats.images.total)} />
      <StatCard
        label="Published"
        value={fmt(stats.images.published)}
        footer={`${publishedPct}% of gallery`}
      />
      <StatCard
        label="Likes (7d)"
        value={fmt(stats.likes.last7d)}
        delta={likesDelta}
        trend={stats.likes.delta >= 0 ? 'up' : 'down'}
      />
      <StatCard label="Active tags" value={fmt(stats.tags.total)} />
    </div>
  )
}
