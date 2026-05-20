import { describe, it, expect } from 'vitest'
import { encodeCursor, decodeCursor } from './cursor'

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a valid payload', () => {
    const payload = { createdAt: '2024-01-01T00:00:00Z', id: 'abc-123' }
    const encoded = encodeCursor(payload)
    const decoded = decodeCursor(encoded)
    expect(decoded).toEqual(payload)
  })

  it('throws on malformed cursor', () => {
    expect(() => decodeCursor('not-valid-base64!!!')).toThrow('Invalid cursor')
  })

  it('throws on empty string', () => {
    expect(() => decodeCursor('')).toThrow('Invalid cursor')
  })
})
