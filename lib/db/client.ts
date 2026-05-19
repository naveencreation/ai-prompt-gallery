import { createServerClient as _createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Server-only admin client -- bypasses RLS. Never use in client components. */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Browser client -- uses anon key, respects RLS. */
export function createBrowserClient() {
  return createClient<Database>(supabaseUrl, anonKey)
}

/** Route Handler / Server Action client -- reads session from cookies. */
export async function createRouteClient() {
  const cookieStore = await cookies()
  return _createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}
