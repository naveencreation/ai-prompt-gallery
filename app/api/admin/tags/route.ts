import { NextResponse, type NextRequest } from 'next/server'
import { findAllTags } from '@/lib/repos/tagRepo'
import { requireAdminSession } from '@/lib/auth'
import { HTTP } from '@/lib/constants/http'

const cacheHeaders = {
  'Cache-Control': 'private, max-age=60',
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  const tags = await findAllTags()
  return NextResponse.json({ tags }, { status: HTTP.OK, headers: cacheHeaders })
}
