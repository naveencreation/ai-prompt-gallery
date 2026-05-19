import type { RateLimit } from './index'
import { MemoryRateLimit } from './memory'

let instance: RateLimit | null = null

export function getRateLimit(): RateLimit {
  if (!instance) {
    instance = new MemoryRateLimit()
  }
  return instance
}

export const rateLimit = getRateLimit()
