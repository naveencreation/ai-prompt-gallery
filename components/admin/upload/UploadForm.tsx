'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import UploadDropzone from './UploadDropzone'
import TagCombobox from './TagCombobox'

interface FileInfo {
  file: File
  width: number
  height: number
  previewUrl: string
}

const schema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  description: z.string().optional(),
  model: z.string().optional(),
  tags: z.array(z.string()),
  isPublished: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function UploadForm({ suggestions }: { suggestions: string[] }) {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      description: '',
      model: '',
      tags: [],
      isPublished: false,
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!fileInfo) {
      toast.error('Please select an image')
      return
    }

    setSubmitting(true)
    try {
      // Step 1: get signed URL
      const sigRes = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.file.name }),
      })
      if (!sigRes.ok) {
        const body = await sigRes.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed to get upload URL')
      }
      const { signedUrl, path, publicUrl, fields, storageProvider } = await sigRes.json()

      // Step 2: upload to storage
      let uploadedPublicUrl = publicUrl as string
      if (fields) {
        const formData = new FormData()
        for (const [key, value] of Object.entries(fields as Record<string, string>)) {
          formData.append(key, value)
        }
        formData.append('file', fileInfo.file)

        const uploadRes = await fetch(signedUrl, {
          method: 'POST',
          body: formData,
        })
        if (!uploadRes.ok) {
          throw new Error('Failed to upload image to storage')
        }
        const uploadBody = await uploadRes.json().catch(() => null)
        uploadedPublicUrl = uploadBody?.secure_url ?? uploadBody?.url ?? publicUrl
      } else {
        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          body: fileInfo.file,
          headers: { 'Content-Type': fileInfo.file.type },
        })
        if (!putRes.ok) {
          throw new Error('Failed to upload image to storage')
        }
      }

      // Step 3: create image record
      const createRes = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            slug: '',
            storage_key: path,
            storage_provider: storageProvider ?? 'supabase',
            image_url: uploadedPublicUrl,
            width: fileInfo.width,
            height: fileInfo.height,
            prompt: data.prompt,
            description: data.description || undefined,
            model: data.model || undefined,
            is_published: data.isPublished,
          },
          tags: data.tags,
        }),
      })
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed to create image record')
      }

      toast.success('Image uploaded successfully')
      reset()
      setFileInfo(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <UploadDropzone value={fileInfo} onChange={setFileInfo} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="prompt" className="text-base font-semibold">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Describe the image prompt..."
          rows={3}
          aria-invalid={!!errors.prompt}
          aria-describedby={errors.prompt ? 'prompt-error' : undefined}
          {...register('prompt')}
        />
        {errors.prompt && (
          <p id="prompt-error" className="text-sm text-destructive font-medium" role="alert">{errors.prompt.message}</p>
        )}
        <p className="text-xs text-muted-foreground">Required. Be specific about the subject, style, and composition.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Short description for the gallery..."
          rows={2}
          {...register('description')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="model">Model (optional)</Label>
        <Input
          id="model"
          placeholder="e.g. Midjourney v6, DALL-E 3, Stable Diffusion XL"
          {...register('model')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tags</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <TagCombobox
              value={field.value}
              onChange={field.onChange}
              suggestions={suggestions}
            />
          )}
        />
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="isPublished"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              id="published"
            />
          )}
        />
        <Label htmlFor="published" className="cursor-pointer">
          Publish immediately
        </Label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting || !fileInfo}>
          {submitting && <Loader2 className="mr-2 animate-spin" />}
          {submitting ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
    </form>
  )
}
