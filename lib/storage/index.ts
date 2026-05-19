export interface SignedUploadResult {
  signedUrl: string
  path: string
}

export interface Storage {
  signedUploadUrl(path: string): Promise<SignedUploadResult>
  publicUrl(storageKey: string): string
  delete(storageKey: string): Promise<void>
}
