import PageContainer from '@/components/admin/PageContainer'
import PageHeader from '@/components/admin/PageHeader'
import UploadForm from '@/components/admin/upload/UploadForm'
import { findAllTags } from '@/lib/repos/tagRepo'

export default async function UploadPage() {
  const tags = await findAllTags()
  const tagNames = tags.map((t) => t.name)

  return (
    <PageContainer
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Upload' },
      ]}
      className="max-w-2xl"
    >
      <PageHeader
        title="Upload"
        description="Add a new image to the gallery."
      />
      <UploadForm suggestions={tagNames} />
    </PageContainer>
  )
}
