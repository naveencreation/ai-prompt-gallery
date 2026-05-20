import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { config } from '@/lib/config'
import { HTTP } from '@/lib/constants/http'

export async function GET() {
  const client = createAdminClient()
  const { error } = await client
    .from('settings')
    .select('id', { count: 'exact', head: true })
    .eq('id', 1)

  if (error) {
    return NextResponse.json({ ok: false }, { status: HTTP.INTERNAL_SERVER_ERROR })
  }

  return NextResponse.json(
    {
      ok: true,
      adapters: {
        cache: config.cache,
        rate: config.rate,
        storage: config.storage,
        errors: config.errors,
        logs: config.logs,
        search: config.search,
      },
    },
    { status: HTTP.OK }
  )
}
