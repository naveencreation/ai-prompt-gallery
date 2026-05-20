import StatCard from './StatCard'
import { getDashboardStats } from '@/lib/services/dashboardService'

export default async function StatsRow() {
  const stats = await getDashboardStats()

  const fmt = (n: number) => n.toLocaleString()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total images" value={fmt(stats.images.total)} delta="+12.1%" trend="up" />
      <StatCard label="Total likes (7d)" value={fmt(stats.likes.last7d)} delta={`${stats.likes.delta > 0 ? '+' : ''}${stats.likes.delta}%`} trend={stats.likes.delta >= 0 ? 'up' : 'down'} />
      <StatCard label="Active tags" value={fmt(stats.tags.total)} delta="+0" trend="up" />
      <StatCard label="Total likes" value={fmt(stats.likes.total)} delta="+0%" trend="up" />
    </div>
  )
}
