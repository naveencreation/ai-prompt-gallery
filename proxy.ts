import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { config as appConfig } from '@/lib/config'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')

  const supabase = createServerClient(
    appConfig.env.NEXT_PUBLIC_SUPABASE_URL,
    appConfig.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (!isAdminRoute && !isApiRoute) {
    const { data: settings } = await supabase
      .from('settings')
      .select('maintenance_mode')
      .eq('id', 1)
      .single()

    if (settings?.maintenance_mode) {
      return new NextResponse('Maintenance', { status: 503 })
    }
  }

  return response
}
