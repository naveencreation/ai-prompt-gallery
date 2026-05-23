'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ExternalLink, Image as ImageIcon, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AdminImage = {
  id: string
  slug: string
  storage_key: string
  storage_provider: string
  image_url: string
  width: number
  height: number
  prompt: string
  description: string | null
  model: string | null
  is_published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

type EditState = {
  prompt: string
  description: string
  model: string
  display_order: string
  is_published: boolean
}

function imageSizeLabel(image: AdminImage) {
  return `${image.width}×${image.height}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function buildEditState(image: AdminImage): EditState {
  return {
    prompt: image.prompt,
    description: image.description ?? '',
    model: image.model ?? '',
    display_order: String(image.display_order ?? ''),
    is_published: image.is_published,
  }
}

export default function ManageImagesTable({
  images,
  previousHref,
  nextHref,
}: {
  images: AdminImage[]
  previousHref: string | null
  nextHref: string | null
}) {
  const router = useRouter()
  const [editingImage, setEditingImage] = React.useState<AdminImage | null>(null)
  const [deletingImage, setDeletingImage] = React.useState<AdminImage | null>(null)
  const [editState, setEditState] = React.useState<EditState | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (editingImage) {
      setEditState(buildEditState(editingImage))
    }
  }, [editingImage])

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingImage || !editState) return

    setSaving(true)
    try {
      const displayOrder = editState.display_order.trim()
      const response = await fetch(`/api/images/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            prompt: editState.prompt.trim(),
            description: editState.description.trim() ? editState.description.trim() : undefined,
            model: editState.model.trim() ? editState.model.trim() : undefined,
            display_order: displayOrder ? Number(displayOrder) : undefined,
            is_published: editState.is_published,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error ?? 'Failed to update image')
      }

      toast.success('Image updated')
      setEditingImage(null)
      setEditState(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update image')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingImage) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/images/${deletingImage.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error ?? 'Failed to delete image')
      }

      toast.success('Image deleted')
      setDeletingImage(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete image')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Preview</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.map((image) => (
              <TableRow key={image.id}>
                <TableCell>
                  <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    <img src={image.image_url} alt={image.slug} className="size-full object-cover" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[24rem] space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium" title={image.slug}>
                        {image.slug}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {image.storage_provider}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground" title={image.prompt}>
                      {image.prompt}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={image.is_published ? 'default' : 'secondary'} className="capitalize">
                    {image.is_published ? 'published' : 'draft'}
                  </Badge>
                </TableCell>
                <TableCell>{imageSizeLabel(image)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="font-medium capitalize">{image.storage_provider}</p>
                    <p className="truncate text-xs text-muted-foreground" title={image.storage_key}>
                      {image.storage_key}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(image.updated_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8" 
                        aria-label={`Actions for ${image.slug}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/p/${image.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink data-icon="inline-start" />
                          <span>View public page</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingImage(image)}>
                        <Pencil data-icon="inline-start" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeletingImage(image)}>
                        <Trash2 data-icon="inline-start" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {images.length} image{images.length === 1 ? '' : 's'}
        </p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {previousHref ? (
              <PaginationItem>
                <PaginationPrevious href={previousHref} />
              </PaginationItem>
            ) : null}
            {nextHref ? (
              <PaginationItem>
                <PaginationNext href={nextHref} />
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      </div>

      <Dialog
        open={editingImage !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingImage(null)
            setEditState(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Edit image</DialogTitle>
              <DialogDescription>Update the image metadata shown across the gallery.</DialogDescription>
            </DialogHeader>

            {editingImage && editState ? (
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="prompt" className="text-base font-semibold">Prompt</Label>
                  <Textarea 
                    id="prompt" 
                    value={editState.prompt} 
                    onChange={(event) => setEditState((current) => current ? { ...current, prompt: event.target.value } : current)} 
                    rows={4} 
                    required
                    className="resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={editState.description} onChange={(event) => setEditState((current) => current ? { ...current, description: event.target.value } : current)} rows={3} placeholder="Optional description" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" value={editState.model} onChange={(event) => setEditState((current) => current ? { ...current, model: event.target.value } : current)} placeholder="Optional model name" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="display-order">Display order</Label>
                  <Input id="display-order" type="number" value={editState.display_order} onChange={(event) => setEditState((current) => current ? { ...current, display_order: event.target.value } : current)} placeholder="Optional numeric order" />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Published</p>
                    <p className="text-xs text-muted-foreground">Make this image visible in the gallery.</p>
                  </div>
                  <Switch checked={editState.is_published} onCheckedChange={(checked) => setEditState((current) => current ? { ...current, is_published: checked } : current)} />
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingImage(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingImage !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingImage(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image record and deletes the uploaded file from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingImage(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}