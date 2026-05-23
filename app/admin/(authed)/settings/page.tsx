"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import PageContainer from '@/components/admin/PageContainer'
import PageHeader from '@/components/admin/PageHeader'
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
    try {
      const res = await fetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(updates), headers: { 'Content-Type': 'application/json' } })
      if (res.ok) {
        const data = await res.json()
        setMaintenance(!!data.maintenance_mode)
        setFeatured(data.featured_image_id ?? null)
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  return (
    <PageContainer
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Settings' },
      ]}
    >
      <PageHeader
        title="Settings"
        description="Manage site-wide settings and preferences."
      />

      <Card className="p-6 space-y-4 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Maintenance Mode</h3>
            <p className="text-sm text-muted-foreground mt-1">Toggle site-wide maintenance mode. When enabled, users will see a maintenance notice.</p>
          </div>
          <Switch 
            checked={maintenance} 
            onCheckedChange={(v) => { setMaintenance(!!v); saveField({ maintenance_mode: !!v }) }}
            aria-label="Toggle maintenance mode"
          />
        </div>
      </Card>

      <Card className="p-6 space-y-4 border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Featured Image</h3>
            <p className="text-sm text-muted-foreground mt-1">Select an image to highlight across the site.</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">{featured ? 'Change' : 'Select'}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <PopoverHeader>
                <PopoverTitle>Select Featured Image</PopoverTitle>
                <PopoverDescription className="text-xs">Search by prompt or ID</PopoverDescription>
              </PopoverHeader>
              <div className="space-y-3 pt-4">
                <Input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Search images..." 
                  className="text-sm"
                />
                <Command className="rounded-lg border">
                  <CommandInput 
                    value={query} 
                    onValueChange={(v: string) => setQuery(v)}
                    placeholder="Filter..."
                  />
                  <CommandList>
                    {images.filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase()))).slice(0, 20).map((img) => (
                      <CommandItem 
                        key={img.id} 
                        onSelect={() => { setFeatured(img.id); saveField({ featured_image_id: img.id }) }}
                        className="text-sm"
                      >
                        {img.prompt || img.id}
                      </CommandItem>
                    ))}
                    {images.filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase()))).length === 0 && <CommandEmpty>No images found</CommandEmpty>}
                  </CommandList>
                </Command>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {featured && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Selected image:</p>
            <Badge className="mt-2 text-xs truncate max-w-xs">{featured}</Badge>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4 border-l-4 border-l-green-500">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Infrastructure</h3>
            <p className="text-sm text-muted-foreground mt-1">View storage adapter and integration status.</p>
          </div>
          <Badge variant="outline" className="font-medium">Supabase</Badge>
        </div>
        <Button variant="secondary" size="sm" onClick={async () => { await fetch('/api/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET, tag: 'sitemap' }) }) }}>Revalidate sitemap</Button>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
    </PageContainer>
  )
}
