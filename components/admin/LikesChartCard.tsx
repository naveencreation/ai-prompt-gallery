import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LikesChart from './LikesChart'
import { getLikesTimeseries } from '@/lib/services/dashboardService'

export default async function LikesChartCard() {
  const data = await getLikesTimeseries(28)

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Likes over last 28 days</CardTitle>
        <CardDescription>Total likes received per day.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <LikesChart data={data} />
        </div>
      </CardContent>
    </Card>
  )
}
