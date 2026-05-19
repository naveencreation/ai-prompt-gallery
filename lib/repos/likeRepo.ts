// lib/repos/likeRepo.ts
import { createAdminClient } from '@/lib/db/client'

export async function getLikeCount(imageId: string): Promise<number> {
  const client = createAdminClient()
  const { data } = await client
    .from('like_counts')
    .select('count')
    .eq('image_id', imageId)
    .single()
  return data?.count ?? 0
}

export async function incrementLike(imageId: string): Promise<number> {
  const client = createAdminClient()

  // Upsert: create row if missing, then increment
  const { data, error } = await client.rpc('increment_like', { p_image_id: imageId })
  if (error) {
    // Fallback: plain update if RPC not yet created
    const { data: row } = await client
      .from('like_counts')
      .select('count')
      .eq('image_id', imageId)
      .single()
    const next = (row?.count ?? 0) + 1
    await client
      .from('like_counts')
      .upsert({ image_id: imageId, count: next })
    return next
  }
  return data as number
}
