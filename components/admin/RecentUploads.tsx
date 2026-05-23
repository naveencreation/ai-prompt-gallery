import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecentUploads } from '@/lib/services/dashboardService'
import { RecentUploadsTable } from './RecentUploadsTable'

export default async function RecentUploads() {
  const uploads = await getRecentUploads(6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent uploads</CardTitle>
        <CardDescription>Last 6 images added to the gallery.</CardDescription>
      </CardHeader>
      <CardContent>
        <RecentUploadsTable uploads={uploads} />
      </CardContent>
    </Card>
  )
}
