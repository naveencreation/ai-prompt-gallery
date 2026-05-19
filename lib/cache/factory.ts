import type { Cache } from './index'
import { MemoryCache } from './memory'

let instance: Cache | null = null

export function getCache(): Cache {
  if (!instance) {
    instance = new MemoryCache()
  }
  return instance
}

export const cache = getCache()
