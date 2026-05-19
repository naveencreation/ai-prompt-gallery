import type { Cache } from './index'

interface Entry {
  value: unknown
  expiresAt: number | null
}

export class MemoryCache implements Cache {
  private store = new Map<string, Entry>()

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry || this.isExpired(entry)) {
      this.store.delete(key)
      return null
    }
    return entry.value as T
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0
    const next = current + 1
    await this.set(key, next, ttlSeconds)
    return next
  }
}
