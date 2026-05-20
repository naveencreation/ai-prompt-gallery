import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { PaginationSchema, CreateImageSchema } from '@/lib/db/schema'
import { getGalleryPage, getImagesByTagSlug } from '@/lib/services/imageService'
import { requireAdminSession } from '@/lib/auth'
import { rateLimit } from '@/lib/ratelimit/factory'
import { HTTP } from '@/lib/constants/http'
import * as imageService from '@/lib/services/imageService'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

const QuerySchema = PaginationSchema.extend({
  tag: z.string().optional(),
  sort: z.enum(['new', 'likes', 'random']).optional(),
})

const BodySchema = z.object({
  image: CreateImageSchema,
  tags: z.array(z.string()).optional(),
})

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = QuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: HTTP.BAD_REQUEST })
  }

  const { cursor, limit, tag, sort } = parsed.data
  if (sort && sort !== 'new') {
    return NextResponse.json(
      { error: 'Sort not implemented' },
      { status: HTTP.BAD_REQUEST }
    )
  }

  if (tag) {
    const result = await getImagesByTagSlug(tag, cursor, limit)
    return NextResponse.json(result, { status: HTTP.OK, headers: cacheHeaders })
  }

  const result = await getGalleryPage(cursor, limit)
  return NextResponse.json(result, { status: HTTP.OK, headers: cacheHeaders })
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  const ip = getClientIp(request)
  const allowed = await rateLimit.check(`images:create:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: HTTP.TOO_MANY_REQUESTS })
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  const image = await imageService.createImage(
    parsed.data.image,
    parsed.data.tags ?? []
  )
  return NextResponse.json(image, { status: HTTP.CREATED })
}
