import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/db/client'
import { HTTP } from '@/lib/constants/http'

/**
 * Minimal liveness probe. Uses the anon client + the `anon can read
 * settings` RLS policy so this endpoint does NOT hold service-role
 * privileges. Body is intentionally minimal -- adapter internals
 * (cache/rate/storage backends, etc.) used to leak from here and
 * were removed per audit L-S3.
 */
export async function GET() {
  const client = createPublicClient()
  const { error } = await client
    .from('settings')
    .select('id', { count: 'exact', head: true })
    .eq('id', 1)

  if (error) {
    return NextResponse.json({ ok: false }, { status: HTTP.INTERNAL_SERVER_ERROR })
  }

  return NextResponse.json({ ok: true }, { status: HTTP.OK })
}
