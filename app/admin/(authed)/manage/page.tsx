import Link from 'next/link'
import { Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import PageContainer from '@/components/admin/PageContainer'
import PageHeader from '@/components/admin/PageHeader'
import ManageImagesTable from '@/components/admin/ManageImagesTable'
import { PAGE_SIZE } from '@/lib/constants/limits'
import { getAllImagesAdmin } from '@/lib/services/imageService'

type SearchParams = {
  cursor?: string
  stack?: string
}

function parseStack(raw?: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function buildHref(cursor: string | null, stack: string[]) {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (stack.length > 0) params.set('stack', JSON.stringify(stack))
  const query = params.toString()
  return query ? `/admin/manage?${query}` : '/admin/manage'
}

export default async function ManagePage({ searchParams }: { searchParams?: SearchParams }) {
  const cursor = searchParams?.cursor
  const stack = parseStack(searchParams?.stack)
  const images = await getAllImagesAdmin(cursor, PAGE_SIZE)
  const previousCursor = stack.at(-1) ?? null
  const previousStack = stack.slice(0, -1)
  const nextStack = [...stack, cursor ?? '__first__']

  return (
    <PageContainer
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Manage' },
      ]}
    >
      <PageHeader
        title="Manage"
        description="Review, edit, and remove gallery images."
        actions={
          <Button asChild>
            <Link href="/admin/upload">Upload image</Link>
          </Button>
        }
      />

      {images.rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>No images yet</EmptyTitle>
            <EmptyDescription>Upload the first image to start building the gallery.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/admin/upload">Upload image</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ManageImagesTable
          images={images.rows}
          previousHref={previousCursor ? buildHref(previousCursor === '__first__' ? null : previousCursor, previousStack) : null}
          nextHref={images.nextCursor ? buildHref(images.nextCursor, nextStack) : null}
        />
      )}
    </PageContainer>
  )
}
