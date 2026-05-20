import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConsoleLogger } from './logger'

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger
  let logSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logger = new ConsoleLogger()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('logs info as structured JSON', () => {
    logger.info('image.created', { id: 'abc' })
    const call = logSpy.mock.calls[0][0]
    const parsed = JSON.parse(call)
    expect(parsed.level).toBe('info')
    expect(parsed.msg).toBe('image.created')
    expect(parsed.id).toBe('abc')
    expect(parsed.ts).toBeDefined()
  })

  it('logs warn as structured JSON', () => {
    logger.warn('slow.query', { ms: 1200 })
    const parsed = JSON.parse(logSpy.mock.calls[0][0])
    expect(parsed.level).toBe('warn')
    expect(parsed.msg).toBe('slow.query')
  })

  it('logs error as structured JSON', () => {
    logger.error('db.failure', { table: 'images' })
    const parsed = JSON.parse(logSpy.mock.calls[0][0])
    expect(parsed.level).toBe('error')
    expect(parsed.msg).toBe('db.failure')
  })
})
