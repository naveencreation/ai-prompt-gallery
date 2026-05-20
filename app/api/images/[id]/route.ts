import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { UpdateImageSchema } from '@/lib/db/schema'
import { getImageByIdPublic } from '@/lib/services/imageService'
import { requireAdminSession } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit/factory'
import { HTTP } from '@/lib/constants/http'
import * as imageService from '@/lib/services/imageService'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

const UpdateBodySchema = z.object({
  image: UpdateImageSchema,
  tags: z.array(z.string()).optional(),
})

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const image = await getImageByIdPublic(id)
  if (!image) {
    return NextResponse.json({ error: 'Not found' }, { status: HTTP.NOT_FOUND })
  }
  return NextResponse.json(image, { status: HTTP.OK, headers: cacheHeaders })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await requireAdminSession(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  const ip = getClientIp(request)
  const allowed = await rateLimit.check(`images:update:${ip}`, 20, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: HTTP.TOO_MANY_REQUESTS })
  }

  const body = await request.json().catch(() => null)
  const parsed = UpdateBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  const image = await imageService.updateImage(id, parsed.data.image, parsed.data.tags)
  return NextResponse.json(image, { status: HTTP.OK })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await requireAdminSession(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  const ip = getClientIp(request)
  const allowed = await rateLimit.check(`images:delete:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: HTTP.TOO_MANY_REQUESTS })
  }

  await imageService.deleteImage(id)
  return NextResponse.json({ ok: true }, { status: HTTP.OK })
}
