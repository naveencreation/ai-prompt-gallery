export interface SignedUploadResult {
  signedUrl: string
  path: string
  storageProvider: 'supabase' | 'cloudinary'
  fields?: Record<string, string>
}

export interface Storage {
  signedUploadUrl(path: string): Promise<SignedUploadResult>
  publicUrl(storageKey: string): string
  delete(storageKey: string): Promise<void>
}
