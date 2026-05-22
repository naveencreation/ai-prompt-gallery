import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createRouteClient } from '@/lib/db/client'
import { requireAdminSession } from '@/lib/auth'
import { cache } from '@/lib/cache/factory'
import { CACHE_TTL_SETTINGS } from '@/lib/constants/cache'

const UpdateSettingsSchema = z.object({
  maintenance_mode: z.boolean().optional(),
  featured_image_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const supabase = await createRouteClient()
  const { data, error } = await supabase.from('settings').select('*').limit(1).single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminSession(request)
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const body = await request.json()
  const parsed = UpdateSettingsSchema.safeParse(body)
  if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 })

  const supabase = await createRouteClient()
  const updates: any = {}
  if (typeof parsed.data.maintenance_mode !== 'undefined') updates.maintenance_mode = parsed.data.maintenance_mode
  if (typeof parsed.data.featured_image_id !== 'undefined') updates.featured_image_id = parsed.data.featured_image_id

  const { data, error } = await supabase.from('settings').update(updates).eq('id', 1).select().single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  // update cache for middleware quick-access
  try {
    await cache.set('maintenance:mode', !!data.maintenance_mode, CACHE_TTL_SETTINGS)
  } catch (_) {}

  return new Response(JSON.stringify(data), { status: 200 })
}
