import type { Search } from './index'
import { PostgresSearch } from './postgres'

let instance: Search | null = null

export function getSearch(): Search {
  if (!instance) {
    instance = new PostgresSearch()
  }
  return instance
}

export const search = getSearch()
