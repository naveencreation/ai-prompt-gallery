import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/admin/PageHeader'
import StatsRow from '@/components/admin/StatsRow'
import LikesOverviewCard from '@/components/admin/LikesOverviewCard'
import PublishRatioCard from '@/components/admin/PublishRatioCard'
import TopTagsCard from '@/components/admin/TopTagsCard'
import GallerySummaryCard from '@/components/admin/GallerySummaryCard'
import RecentUploads from '@/components/admin/RecentUploads'
import DashboardDateRange from '@/components/admin/dashboard/DashboardDateRange'
import {
  StatsSkeleton,
  OverviewSkeleton,
  SideCardSkeleton,
  TagsSkeleton,
  ListCardSkeleton,
} from '@/components/admin/dashboard/DashboardSkeletons'

export default function DashboardPage() {
  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your gallery performance."
        actions={
          <>
            <DashboardDateRange />
            <Button asChild>
              <Link href="/admin/upload">New upload</Link>
            </Button>
          </>
        }
      />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsRow />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<OverviewSkeleton />}>
          <LikesOverviewCard />
        </Suspense>
        <Suspense fallback={<SideCardSkeleton />}>
          <PublishRatioCard />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<TagsSkeleton />}>
          <TopTagsCard />
        </Suspense>
        <Suspense fallback={<ListCardSkeleton />}>
          <GallerySummaryCard />
        </Suspense>
      </div>

      <Suspense fallback={<ListCardSkeleton />}>
        <RecentUploads />
      </Suspense>
    </div>
  )
}
