import { createAdminClient } from '@/lib/db/client'
import type { Search, SearchResult, SearchOptions } from './index'

export class PostgresSearch implements Search {
  async query(q: string, opts: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 20 } = opts
    const client = createAdminClient()

    const { data, error } = await client
      .from('images')
      .select('id, slug, image_url, prompt, search_vector')
      .eq('is_published', true)
      .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
      .limit(limit)

    if (error) throw new Error(`Search error: ${error.message}`)

    return (data ?? []).map((row, i) => ({
      id: row.id,
      slug: row.slug,
      imageUrl: row.image_url,
      prompt: row.prompt,
      rank: i,
    }))
  }
}
