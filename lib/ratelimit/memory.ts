import type { RateLimit } from './index'

interface Bucket {
  count: number
  resetAt: number
}

export class MemoryRateLimit implements RateLimit {
  private buckets = new Map<string, Bucket>()

  async check(key: string, limit: number, windowSec: number): Promise<boolean> {
    const now = Date.now()
    const bucket = this.buckets.get(key)

    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
      return true
    }

    if (bucket.count >= limit) return false

    bucket.count += 1
    return true
  }
}
