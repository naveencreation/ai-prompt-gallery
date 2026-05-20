import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { config as appConfig } from '@/lib/config'
import { cache } from '@/lib/cache/factory'
import { createAdminClient } from '@/lib/db/client'

const PUBLIC_ADMIN_PATHS = ['/admin/login']

function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
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

  // 1. Admin route guard (skip login page)
  if (pathname.startsWith('/admin') && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 2. Maintenance mode (cached 60s); skip for admin + health routes
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  const isHealth = pathname === '/api/health'

  if (!isAdminRoute && !isHealth) {
    const maintenance = await cache.get<boolean>('maintenance:mode')
    if (maintenance === true) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Maintenance mode' },
          { status: 503, headers: { 'Retry-After': '60' } }
        )
      }
      response.headers.set('x-maintenance', '1')
    } else if (maintenance === null) {
      try {
        const db = createAdminClient()
        const { data } = await db
          .from('settings')
          .select('maintenance_mode')
          .eq('id', 1)
          .single()
        const enabled = data?.maintenance_mode ?? false
        await cache.set('maintenance:mode', enabled, 60)
        if (enabled) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Maintenance mode' },
              { status: 503, headers: { 'Retry-After': '60' } }
            )
          }
          response.headers.set('x-maintenance', '1')
        }
      } catch {
        // DB unreachable — degrade gracefully
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)$).*)'],
}
