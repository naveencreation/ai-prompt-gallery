// lib/services/searchService.ts
import { search } from '@/lib/search/factory'
import type { SearchOptions } from '@/lib/search/index'

export async function searchImages(q: string, opts?: SearchOptions) {
  if (!q.trim()) return []
  return search.query(q.trim(), opts)
}
