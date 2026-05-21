import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { config } from '@/lib/config'
import { HTTP } from '@/lib/constants/http'

/**
 * Build a server client for a route handler. Cookies refreshed by Supabase
 * Auth are written back through the provided NextResponse so the session
 * stays alive instead of getting stuck on a stale access token.
 */
function buildClient(request: NextRequest, response?: NextResponse) {
  return createServerClient(
    config.env.NEXT_PUBLIC_SUPABASE_URL,
    config.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          if (!response) return
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function getOptionalSession(
  request: NextRequest,
  response?: NextResponse
) {
  const supabase = buildClient(request, response)
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user ?? null
}

/**
 * Admin status lives in `app_metadata.role` (NOT `user_metadata`, which is
 * user-editable and unsafe for authorization per the supabase skill). Set
 * it via SQL or the admin API:
 *
 *   update auth.users
 *      set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
 *    where email = 'you@example.com';
 */
export function isAdmin(user: User | null): boolean {
  return user?.app_metadata?.role === 'admin'
}

export async function requireAdminSession(
  request: NextRequest,
  response?: NextResponse
) {
  const user = await getOptionalSession(request, response)
  if (!user) throw new Error('UNAUTHORIZED')
  if (!isAdmin(user)) throw new Error('FORBIDDEN')
  return user
}

/**
 * Route-handler helper: returns either the authenticated admin user or a
 * NextResponse with the appropriate status (401 unauthenticated / 403
 * authenticated-but-not-admin). Replaces the older try/catch + 401 idiom.
 */
export async function adminGuard(request: NextRequest) {
  try {
    const user = await requireAdminSession(request)
    return { user, response: null as NextResponse | null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNAUTHORIZED'
    const status =
      message === 'FORBIDDEN' ? HTTP.FORBIDDEN : HTTP.UNAUTHORIZED
    return {
      user: null,
      response: NextResponse.json({ error: message }, { status }),
    }
  }
}
