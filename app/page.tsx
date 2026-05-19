// app/page.tsx
import { createAdminClient } from '@/lib/db/client'

export default async function HomePage() {
  const client = createAdminClient()
  const { data: images } = await client
    .from('images')
    .select('id, slug, prompt, image_url')
    .eq('is_published', true)
    .limit(10)

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AI Prompt Gallery</h1>
      <p>Phase 2 placeholder — {images?.length ?? 0} published image(s) found.</p>
      <ul>
        {images?.map((img) => (
          <li key={img.id}>{img.prompt}</li>
        ))}
      </ul>
    </main>
  )
}
