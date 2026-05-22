import crypto from 'node:crypto'
import { config } from '@/lib/config'
import type { SignedUploadResult, Storage } from './index'

function requireCloudinaryEnv() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = config.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary env vars')
  }

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  }
}

function sign(params: Record<string, string>, apiSecret: string) {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return crypto.createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex')
}

async function readJson(response: Response) {
  return response.json().catch(() => null)
}

export class CloudinaryStorage implements Storage {
  async signedUploadUrl(path: string): Promise<SignedUploadResult> {
    const { cloudName, apiKey, apiSecret } = requireCloudinaryEnv()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = sign({ public_id: path, timestamp }, apiSecret)

    return {
      signedUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      path,
      storageProvider: 'cloudinary',
      fields: {
        api_key: apiKey,
        public_id: path,
        timestamp,
        signature,
      },
    }
  }

  publicUrl(storageKey: string): string {
    const { cloudName } = requireCloudinaryEnv()
    return `https://res.cloudinary.com/${cloudName}/image/upload/${storageKey}`
  }

  async delete(storageKey: string): Promise<void> {
    const { cloudName, apiKey, apiSecret } = requireCloudinaryEnv()
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const signature = sign({ public_id: storageKey, timestamp }, apiSecret)
    const body = new URLSearchParams({
      public_id: storageKey,
      api_key: apiKey,
      timestamp,
      signature,
    })

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }
    )

    if (!response.ok) {
      throw new Error(`Storage delete error: ${response.status}`)
    }

    const data = await readJson(response)
    if (data?.result !== 'ok' && data?.result !== 'not found') {
      throw new Error(`Storage delete error: ${data?.result ?? 'unknown'}`)
    }
  }
}