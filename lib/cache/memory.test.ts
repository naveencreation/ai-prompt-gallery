import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryCache } from './memory'

describe('MemoryCache', () => {
  let cache: MemoryCache

  beforeEach(() => {
    cache = new MemoryCache()
  })

  it('stores and retrieves a value', async () => {
    await cache.set('key', 'value')
    const result = await cache.get('key')
    expect(result).toBe('value')
  })

  it('returns null for missing keys', async () => {
    const result = await cache.get('missing')
    expect(result).toBeNull()
  })

  it('returns null after TTL expires', async () => {
    await cache.set('key', 'value', 0.01) // 10ms
    expect(await cache.get('key')).toBe('value')
    await new Promise((r) => setTimeout(r, 50))
    expect(await cache.get('key')).toBeNull()
  })

  it('deletes a key', async () => {
    await cache.set('key', 'value')
    await cache.del('key')
    expect(await cache.get('key')).toBeNull()
  })

  it('increments a key starting from zero', async () => {
    const first = await cache.incr('counter')
    expect(first).toBe(1)
    const second = await cache.incr('counter')
    expect(second).toBe(2)
  })

  it('increments respects TTL', async () => {
    await cache.incr('counter', 0.01)
    expect(await cache.get('counter')).toBe(1)
    await new Promise((r) => setTimeout(r, 50))
    expect(await cache.get('counter')).toBeNull()
  })
})
