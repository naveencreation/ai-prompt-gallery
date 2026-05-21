// app/page.tsx
import { createPublicClient } from '@/lib/db/client'

export default async function HomePage() {
  // RLS policy `anon can read published images` already filters this;
  // no need for the service role here.
  const client = createPublicClient()
  const { data: images } = await client
    .from('images')
    .select('id, slug, prompt, image_url')
    .eq('is_published', true)
    .limit(10)

  return (
    <main className="flex flex-col gap-4 p-8 font-sans">
      <h1 className="text-2xl font-bold tracking-tight">AI Prompt Gallery</h1>
      <p className="text-muted-foreground">
        Phase 2 placeholder — {images?.length ?? 0} published image(s) found.
      </p>
      <ul className="flex flex-col gap-2">
        {images?.map((img) => (
          <li key={img.id}>{img.prompt}</li>
        ))}
      </ul>
    </main>
  )
}
