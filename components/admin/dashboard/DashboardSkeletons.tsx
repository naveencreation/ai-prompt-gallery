import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="flex min-h-[108px] flex-col">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2 pt-2">
            <Skeleton className="h-9 w-16 lg:h-10" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function OverviewSkeleton() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
          <Skeleton className="h-[260px] w-full" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SideCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mx-auto size-[180px] rounded-full" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TagsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export function ListCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
