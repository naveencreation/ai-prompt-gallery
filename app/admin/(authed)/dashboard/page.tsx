import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/admin/PageHeader'
import StatsRow from '@/components/admin/StatsRow'
import LikesChartCard from '@/components/admin/LikesChartCard'
import TopTagsCard from '@/components/admin/TopTagsCard'
import RecentUploads from '@/components/admin/RecentUploads'

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-6">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-[140px] w-full" />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border p-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      ))}
    </div>
  )
}

function UploadsSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-6">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your gallery performance."
        actions={<Button>New upload</Button>}
      />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsRow />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-3">
        <Suspense fallback={<CardSkeleton />}>
          <LikesChartCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TopTagsCard />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<UploadsSkeleton />}>
          <RecentUploads />
        </Suspense>
      </div>
    </div>
  )
}
