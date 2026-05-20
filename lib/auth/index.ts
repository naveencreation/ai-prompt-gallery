import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { config } from '@/lib/config'

export async function getOptionalSession(request: NextRequest) {
  const supabase = createServerClient(
    config.env.NEXT_PUBLIC_SUPABASE_URL,
    config.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

export async function requireAdminSession(request: NextRequest) {
  const user = await getOptionalSession(request)
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
