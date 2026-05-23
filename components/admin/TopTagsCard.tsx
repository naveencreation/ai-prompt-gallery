import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTopTags } from '@/lib/services/dashboardService'
import { TopTagsChart } from './TopTagsChart'

export default async function TopTagsCard() {
  const tags = await getTopTags(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top tags</CardTitle>
        <CardDescription>Most used tags across all images.</CardDescription>
      </CardHeader>
      <CardContent>
        <TopTagsChart tags={tags} />
      </CardContent>
    </Card>
  )
}
