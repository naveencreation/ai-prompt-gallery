import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { config } from '@/lib/config'
import { HTTP } from '@/lib/constants/http'

const BodySchema = z.object({
  secret: z.string().min(1),
  tag: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  if (!config.env.REVALIDATE_SECRET || parsed.data.secret !== config.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: HTTP.UNAUTHORIZED })
  }

  revalidateTag(parsed.data.tag, 'default')
  return NextResponse.json({ ok: true }, { status: HTTP.OK })
}
