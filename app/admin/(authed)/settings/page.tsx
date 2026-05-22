"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command'
import { InputGroup } from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [maintenance, setMaintenance] = useState(false)
  const [featured, setFeatured] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setMaintenance(!!data.maintenance_mode)
        setFeatured(data.featured_image_id ?? null)
      }

      const imgs = await fetch('/api/images?limit=50')
      if (imgs.ok) {
        const body = await imgs.json()
        setImages(body?.rows ?? [])
      }

      setLoading(false)
    }
    load()
  }, [])

  async function saveField(updates: any) {
    const res = await fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(updates), headers: { 'Content-Type': 'application/json' } })
    if (res.ok) {
      const data = await res.json()
      setMaintenance(!!data.maintenance_mode)
      setFeatured(data.featured_image_id ?? null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Maintenance Mode</h3>
            <p className="text-sm text-muted-foreground">Toggle site-wide maintenance mode (middleware uses this).</p>
          </div>
          <Switch checked={maintenance} onCheckedChange={(v) => { setMaintenance(!!v); saveField({ maintenance_mode: !!v }) }} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Featured Image</h3>
            <p className="text-sm text-muted-foreground">Pick an image to feature across the site.</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button>{featured ? 'Change' : 'Select'}</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Select Featured Image</PopoverTitle>
                <PopoverDescription>Search images by prompt or id</PopoverDescription>
              </PopoverHeader>
              <div className="pt-2">
                <InputGroup>
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search images" />
                </InputGroup>
                <Command className="mt-2">
                  <CommandInput value={query} onValueChange={(v: string) => setQuery(v)} />
                  <CommandList>
                    {images.filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase()))).slice(0, 20).map((img) => (
                      <CommandItem key={img.id} onSelect={() => { setFeatured(img.id); saveField({ featured_image_id: img.id }) }}>{img.prompt || img.id}</CommandItem>
                    ))}
                    {images.filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase()))).length === 0 && <CommandEmpty>No images</CommandEmpty>}
                  </CommandList>
                </Command>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {featured && <div className="mt-4">Selected: <Badge>{featured}</Badge></div>}
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Infrastructure</h3>
            <p className="text-sm text-muted-foreground">Adapter and integrations status.</p>
          </div>
          <div>
            <Badge>Supabase</Badge>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={async () => { await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET, tag: 'sitemap' }) }) }}>Rebuild sitemap</Button>
        </div>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
    </div>
  )
}
