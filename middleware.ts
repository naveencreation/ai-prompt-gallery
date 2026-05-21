import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { config as appConfig } from '@/lib/config'
import { cache } from '@/lib/cache/factory'
import { createPublicClient } from '@/lib/db/client'
import { isAdmin } from '@/lib/auth'

// Module-scoped single-flight promise: while one request is fetching
// the maintenance flag, others wait for the same promise instead of
// stampeding the DB. The promise is cleared as soon as it settles.
let maintenanceFetchInFlight: Promise<boolean> | null = null

async function fetchMaintenanceFlag(): Promise<boolean> {
  if (maintenanceFetchInFlight) return maintenanceFetchInFlight
  maintenanceFetchInFlight = (async () => {
    try {
      // Uses anon client + existing "anon can read settings" RLS policy.
      // No need for the service role here.
      const db = createPublicClient()
      const { data } = await db
        .from('settings')
        .select('maintenance_mode')
        .eq('id', 1)
        .single()
      const enabled = data?.maintenance_mode ?? false
      await cache.set('maintenance:mode', enabled, 60)
      return enabled
    } catch {
      // Fail open: cache `false` briefly so we don't re-hit on every
      // request when the DB is unreachable.
      await cache.set('maintenance:mode', false, 10)
      return false
    } finally {
      maintenanceFetchInFlight = null
    }
  })()
  return maintenanceFetchInFlight
}

const PUBLIC_ADMIN_PATHS = ['/admin/login']

function createMiddlewareClient(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const client = createServerClient(
    appConfig.env.NEXT_PUBLIC_SUPABASE_URL,
    appConfig.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { client, response }
}

export async function middleware(request: NextRequest) {
  const { client, response } = createMiddlewareClient(request)
  const { pathname } = request.nextUrl

  // 1. Admin route guard (skip login page).
  // Defense in depth: the layout also checks isAdmin, but enforcing here
  // keeps unauthorized requests from reaching any admin page or RSC.
  if (pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (!isAdmin(data.user)) {
      return NextResponse.redirect(
        new URL('/admin/login?error=forbidden', request.url)
      )
    }
  }

  // 2. Maintenance mode (cached 60s); skip for admin + health routes
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isHealth = pathname === '/api/health'

  if (!isAdminRoute && !isHealth) {
    let maintenance = await cache.get<boolean>('maintenance:mode')
    if (maintenance === null) {
      // Cache miss -> single-flight fetch shared across concurrent requests.
      maintenance = await fetchMaintenanceFlag()
    }
    if (maintenance === true) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Maintenance mode' },
          { status: 503, headers: { 'Retry-After': '60' } }
        )
      }
      response.headers.set('x-maintenance', '1')
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)$).*)'],
}
