// lib/config.ts
import { z } from 'zod'

// Supabase rolled out new key names (`sb_publishable_...` / `sb_secret_...`)
// alongside the legacy `anon` / `service_role` JWTs. The SDK accepts either
// value, so we accept either env var name and normalize to the legacy
// internal names that the rest of the app reads.
const rawEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    REVALIDATE_SECRET: z.string().min(16).optional(),

    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    SENTRY_DSN: z.string().url().optional(),
    AXIOM_TOKEN: z.string().optional(),
    AXIOM_DATASET: z.string().optional(),
    MEILISEARCH_HOST: z.string().url().optional(),
    MEILISEARCH_API_KEY: z.string().optional(),
  })
  .parse(process.env)

const publicKey =
  rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!publicKey) {
  throw new Error(
    'Supabase env: set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY).'
  )
}

const env = {
  ...rawEnv,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: publicKey,
  SUPABASE_SERVICE_ROLE_KEY:
    rawEnv.SUPABASE_SERVICE_ROLE_KEY ?? rawEnv.SUPABASE_SECRET_KEY,
}

export const config = {
  cache: env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
  rate: env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory',
  storage: env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'supabase',
  errors: env.SENTRY_DSN ? 'sentry' : 'console',
  logs: env.AXIOM_TOKEN ? 'axiom' : 'console',
  search: env.MEILISEARCH_HOST ? 'meili' : 'postgres',
  env,
} as const
