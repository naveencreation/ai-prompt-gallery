export interface SearchResult {
  id: string
  slug: string
  imageUrl: string
  prompt: string
  rank: number
}

export interface SearchOptions {
  limit?: number
  cursor?: string
}

export interface Search {
  query(q: string, opts?: SearchOptions): Promise<SearchResult[]>
}
