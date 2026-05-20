import { NextResponse, type NextRequest } from 'next/server'
import { SearchQuerySchema } from '@/lib/db/schema'
import { searchImages } from '@/lib/services/searchService'
import { HTTP } from '@/lib/constants/http'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const parsed = SearchQuerySchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: HTTP.BAD_REQUEST })
  }

  const results = await searchImages(parsed.data.q, {
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  })

  return NextResponse.json(results, { status: HTTP.OK, headers: cacheHeaders })
}
