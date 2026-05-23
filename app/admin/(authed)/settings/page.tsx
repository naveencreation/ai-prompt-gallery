"use client"

import * as React from 'react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import PageContainer from '@/components/admin/PageContainer'
import PageHeader from '@/components/admin/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [maintenance, setMaintenance] = useState(false)
  const [featured, setFeatured] = useState<string | null>(null)
  const [images, setImages] = useState<any[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setMaintenance(!!data.maintenance_mode)
          setFeatured(data.featured_image_id ?? null)
        } else {
          toast.error('Failed to load settings')
        }

        const imgs = await fetch('/api/images?limit=50')
        if (imgs.ok) {
          const body = await imgs.json()
          setImages(body?.rows ?? [])
        } else {
          toast.error('Failed to load images')
        }
      } catch (err) {
        toast.error('An error occurred while loading settings')
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveField(updates: any) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setMaintenance(!!data.maintenance_mode)
        setFeatured(data.featured_image_id ?? null)
        toast.success('Settings saved successfully')
      } else {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData?.error || 'Failed to save settings')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred'
      toast.error(`Save error: ${message}`)
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRevalidate() {
    try {
      const res = await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET, tag: 'sitemap' }),
      })
      if (res.ok) {
        toast.success('Sitemap revalidated successfully')
      } else {
        toast.error('Failed to revalidate sitemap')
      }
    } catch (err) {
      toast.error('An error occurred while revalidating')
      console.error('Revalidate error:', err)
    }
  }

  if (loading) {
    return (
      <PageContainer
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Settings' },
        ]}
      >
        <PageHeader title="Settings" description="Manage site-wide settings and preferences." />
        <div className="text-sm text-muted-foreground py-8">Loading settings...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      breadcrumbs={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Settings' },
      ]}
    >
      <PageHeader title="Settings" description="Manage site-wide settings and preferences." />

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
            <CardDescription>Site-wide general settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Maintenance Mode */}
            <div className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div className="flex-1 space-y-1">
                <Label className="text-base font-medium">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle site-wide maintenance mode. When enabled, users will see a maintenance notice.
                </p>
              </div>
              <div className="ml-4">
                <Switch
                  checked={maintenance}
                  onCheckedChange={(v) => {
                    setMaintenance(!!v)
                    saveField({ maintenance_mode: !!v })
                  }}
                  aria-label="Toggle maintenance mode"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
            <CardDescription>Manage featured content and gallery settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Featured Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Featured Image</Label>
                  <p className="text-sm text-muted-foreground">
                    Select an image to highlight across the site.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={saving}>
                      {featured ? 'Change' : 'Select'} Image
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0">
                    <div className="space-y-2 p-4">
                      <h4 className="font-medium text-sm">Select Featured Image</h4>
                      <p className="text-xs text-muted-foreground">Search by prompt or ID</p>
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
                          {images
                            .filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase())))
                            .slice(0, 20)
                            .map((img) => (
                              <CommandItem
                                key={img.id}
                                onSelect={() => {
                                  setFeatured(img.id)
                                  saveField({ featured_image_id: img.id })
                                }}
                                className="text-sm"
                              >
                                {img.prompt || img.id}
                              </CommandItem>
                            ))}
                          {images.filter((img) => !query || (img.prompt && img.prompt.toLowerCase().includes(query.toLowerCase())))
                            .length === 0 && <CommandEmpty>No images found</CommandEmpty>}
                        </CommandList>
                      </Command>
                    </div>
                  </PopoverContent>
                </Popover>

                {featured && (
                  <div className="flex-1">
                    <Badge variant="secondary" className="text-xs truncate max-w-xs">
                      {featured}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Infrastructure</CardTitle>
            <CardDescription>Storage and integration settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Label className="text-base font-medium">Storage Adapter</Label>
                <p className="text-sm text-muted-foreground">Current storage service and status</p>
              </div>
              <Badge>Supabase</Badge>
            </div>

            <div className="border-t pt-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Cache & CDN</Label>
                <p className="text-sm text-muted-foreground">Revalidate site cache and CDN content</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevalidate}
                  disabled={saving}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Revalidate Sitemap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
