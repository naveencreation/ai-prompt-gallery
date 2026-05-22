import { config } from '@/lib/config'
import type { Storage } from './index'
import { CloudinaryStorage } from './cloudinary'
import { SupabaseStorage } from './supabase'

let instance: Storage | null = null

export function getStorage(): Storage {
  if (!instance) {
    if (config.storage === 'supabase') {
      instance = new SupabaseStorage()
    } else if (config.storage === 'cloudinary') {
      instance = new CloudinaryStorage()
    } else {
      throw new Error(`Unknown storage provider: ${config.storage}`)
    }
  }
  return instance
}

export const storage: Storage = {
  signedUploadUrl(path: string) {
    return getStorage().signedUploadUrl(path)
  },
  publicUrl(storageKey: string) {
    return getStorage().publicUrl(storageKey)
  },
  delete(storageKey: string) {
    return getStorage().delete(storageKey)
  },
}
