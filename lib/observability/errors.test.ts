import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConsoleErrorReporter } from './errors'

describe('ConsoleErrorReporter', () => {
  let reporter: ConsoleErrorReporter
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    reporter = new ConsoleErrorReporter()
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('captures an Error with message and stack', () => {
    const err = new Error('Something broke')
    reporter.capture(err, { route: '/api/images' })
    const parsed = JSON.parse(errorSpy.mock.calls[0][0])
    expect(parsed.level).toBe('error')
    expect(parsed.err.message).toBe('Something broke')
    expect(parsed.err.stack).toContain('Error:')
    expect(parsed.route).toBe('/api/images')
    expect(parsed.ts).toBeDefined()
  })

  it('captures a non-Error value as a string', () => {
    reporter.capture('plain string')
    const parsed = JSON.parse(errorSpy.mock.calls[0][0])
    expect(parsed.err).toBe('plain string')
  })
})
