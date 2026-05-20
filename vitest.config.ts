import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Set dummy env vars before any module imports them
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy-service-key'
process.env.REVALIDATE_SECRET = 'dummy-revalidate-secret-32-chars-long'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    setupFiles: ['./vitest.setup.ts'],
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'app/**/*.test.ts', 'app/**/*.test.tsx', 'components/**/*.test.ts', 'components/**/*.test.tsx'],
    coverage: {
      reporter: ['text'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
})
