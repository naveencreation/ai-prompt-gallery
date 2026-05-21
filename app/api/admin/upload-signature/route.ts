import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { storage } from '@/lib/storage/factory'
import { adminGuard } from '@/lib/auth'
import { HTTP } from '@/lib/constants/http'

const BodySchema = z.object({
  path: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
})

export async function POST(request: NextRequest) {
  const guard = await adminGuard(request)
  if (guard.response) return guard.response

  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  let path = parsed.data.path
  if (!path) {
    const ext = parsed.data.filename?.split('.').pop() ?? 'jpg'
    path = `originals/${nanoid(16)}.${ext}`
  }

  const { signedUrl } = await storage.signedUploadUrl(path)
  const publicUrl = storage.publicUrl(path)
  return NextResponse.json({ signedUrl, path, publicUrl }, { status: HTTP.OK })
}
