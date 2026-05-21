import { NextResponse, type NextRequest } from 'next/server'
import { findAllTags } from '@/lib/repos/tagRepo'
import { adminGuard } from '@/lib/auth'
import { HTTP } from '@/lib/constants/http'

const cacheHeaders = {
  'Cache-Control': 'private, max-age=60',
}

export async function GET(request: NextRequest) {
  const guard = await adminGuard(request)
  if (guard.response) return guard.response

  const tags = await findAllTags()
  return NextResponse.json({ tags }, { status: HTTP.OK, headers: cacheHeaders })
}
