import { config } from '@/lib/config'
import type { Storage } from './index'
import { SupabaseStorage } from './supabase'

let instance: Storage | null = null

export function getStorage(): Storage {
  if (!instance) {
    if (config.storage === 'supabase') {
      instance = new SupabaseStorage()
    } else {
      throw new Error('Cloudinary storage not yet implemented')
    }
  }
  return instance
}

export const storage = getStorage()
