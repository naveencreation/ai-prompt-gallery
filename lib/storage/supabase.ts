import { createAdminClient } from '@/lib/db/client'
import type { Storage, SignedUploadResult } from './index'

const BUCKET = 'images'

export class SupabaseStorage implements Storage {
  async signedUploadUrl(path: string): Promise<SignedUploadResult> {
    const client = createAdminClient()
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)
    if (error || !data) throw new Error(`Storage sign error: ${error?.message}`)
    return { signedUrl: data.signedUrl, path: data.path }
  }

  publicUrl(storageKey: string): string {
    const client = createAdminClient()
    const { data } = client.storage.from(BUCKET).getPublicUrl(storageKey)
    return data.publicUrl
  }

  async delete(storageKey: string): Promise<void> {
    const client = createAdminClient()
    const { error } = await client.storage.from(BUCKET).remove([storageKey])
    if (error) throw new Error(`Storage delete error: ${error.message}`)
  }
}
