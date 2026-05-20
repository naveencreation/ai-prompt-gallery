import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteClient } from '@/lib/db/client'
import { HTTP } from '@/lib/constants/http'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: HTTP.BAD_REQUEST })
  }

  const supabase = await createRouteClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: HTTP.UNAUTHORIZED })
  }

  return NextResponse.json({ user: data.user }, { status: HTTP.OK })
}

export async function DELETE() {
  const supabase = await createRouteClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true }, { status: HTTP.NO_CONTENT })
}
