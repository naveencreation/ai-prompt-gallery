import { SLUG_MAX_LENGTH } from '@/lib/constants/limits'

export function generateSlug(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, SLUG_MAX_LENGTH)
}

export function generateSlugWithSuffix(prompt: string, suffix: string): string {
  const base = generateSlug(prompt).slice(0, SLUG_MAX_LENGTH - suffix.length - 1)
  return `${base}-${suffix}`
}
