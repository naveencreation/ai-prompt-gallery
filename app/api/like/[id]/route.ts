import { NextResponse, type NextRequest } from 'next/server'
import { addLike } from '@/lib/services/likeService'
import { HTTP } from '@/lib/constants/http'

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ip = getClientIp(request)

  try {
    const count = await addLike(id, ip)
    return NextResponse.json({ count }, { status: HTTP.OK })
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: 'Rate limited' },
        { status: HTTP.TOO_MANY_REQUESTS }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add like' },
      { status: HTTP.INTERNAL_SERVER_ERROR }
    )
  }
}
