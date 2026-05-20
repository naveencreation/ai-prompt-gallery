import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { storage } from '@/lib/storage/factory'
import { requireAdminSession } from '@/lib/auth'
import { HTTP } from '@/lib/constants/http'

const BodySchema = z.object({
  path: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  const result = await storage.signedUploadUrl(parsed.data.path)
  return NextResponse.json(result, { status: HTTP.OK })
}
