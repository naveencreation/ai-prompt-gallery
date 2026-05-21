import PageHeader from '@/components/admin/PageHeader'
import UploadForm from '@/components/admin/upload/UploadForm'
import { findAllTags } from '@/lib/repos/tagRepo'

export default async function UploadPage() {
  const tags = await findAllTags()
  const tagNames = tags.map((t) => t.name)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader
        title="Upload"
        description="Add a new image to the gallery."
      />
      <UploadForm suggestions={tagNames} />
    </div>
  )
}
