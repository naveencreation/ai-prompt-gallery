import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRateLimit } from './memory'

describe('MemoryRateLimit', () => {
  let limiter: MemoryRateLimit

  beforeEach(() => {
    limiter = new MemoryRateLimit()
  })

  it('allows requests under the limit', async () => {
    const result = await limiter.check('ip:1', 3, 60)
    expect(result).toBe(true)
  })

  it('blocks requests over the limit', async () => {
    await limiter.check('ip:1', 2, 60)
    await limiter.check('ip:1', 2, 60)
    const result = await limiter.check('ip:1', 2, 60)
    expect(result).toBe(false)
  })

  it('resets the window after expiry', async () => {
    await limiter.check('ip:1', 1, 0.01) // 10ms window
    await new Promise((r) => setTimeout(r, 50))
    const result = await limiter.check('ip:1', 1, 60)
    expect(result).toBe(true)
  })

  it('tracks different keys independently', async () => {
    await limiter.check('ip:1', 1, 60)
    const result = await limiter.check('ip:2', 1, 60)
    expect(result).toBe(true)
  })
})
