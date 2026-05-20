import { describe, it, expect } from 'vitest'
import { generateSlug, generateSlugWithSuffix } from './slug'

describe('generateSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('strips special characters', () => {
    expect(generateSlug('A.I. Art @ Gallery!')).toBe('ai-art-gallery')
  })

  it('collapses multiple hyphens', () => {
    expect(generateSlug('hello---world')).toBe('hello-world')
  })

  it('respects max length', () => {
    const long = 'a'.repeat(200)
    expect(generateSlug(long).length).toBe(100)
  })

  it('trims leading/trailing whitespace', () => {
    expect(generateSlug('  spaced out  ')).toBe('spaced-out')
  })
})

describe('generateSlugWithSuffix', () => {
  it('appends suffix with hyphen', () => {
    expect(generateSlugWithSuffix('Hello World', 'xyz')).toBe('hello-world-xyz')
  })

  it('truncates base to fit suffix within max length', () => {
    const long = 'a'.repeat(200)
    const result = generateSlugWithSuffix(long, 'suffix')
    expect(result.endsWith('-suffix')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(100)
  })
})
