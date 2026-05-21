'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
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
      const sigRes = await fetch('/api/admin/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileInfo.file.name }),
      })
      if (!sigRes.ok) {
        const body = await sigRes.json().catch(() => null)
        throw new Error(body?.error ?? 'Failed to get upload URL')
      }
      const { signedUrl, path, publicUrl } = await sigRes.json()

      const putRes = await fetch(signedUrl, {
        method: 'PUT',
        body: fileInfo.file,
        headers: { 'Content-Type': fileInfo.file.type },
      })
      if (!putRes.ok) {
        throw new Error('Failed to upload image to storage')
      }

      const createRes = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            slug: '',
            storage_key: path,
            image_url: publicUrl,
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <UploadDropzone value={fileInfo} onChange={setFileInfo} />

        <Field data-invalid={!!errors.prompt || undefined}>
          <FieldLabel htmlFor="prompt">Prompt</FieldLabel>
          <Textarea
            id="prompt"
            placeholder="Describe the image prompt..."
            rows={3}
            aria-invalid={!!errors.prompt || undefined}
            {...register('prompt')}
          />
          {errors.prompt && (
            <FieldDescription>{errors.prompt.message}</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
          <Textarea
            id="description"
            placeholder="Short description for the gallery..."
            rows={2}
            {...register('description')}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="model">Model (optional)</FieldLabel>
          <Input
            id="model"
            placeholder="e.g. Midjourney v6, DALL-E 3, Stable Diffusion XL"
            {...register('model')}
          />
        </Field>

        <Field>
          <FieldLabel>Tags</FieldLabel>
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
        </Field>

        <FieldSet>
          <Field orientation="horizontal">
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
            <FieldLabel htmlFor="published" className="cursor-pointer">
              Publish immediately
            </FieldLabel>
          </Field>
        </FieldSet>

        <Button type="submit" disabled={submitting || !fileInfo}>
          {submitting && <Spinner data-icon="inline-start" />}
          {submitting ? 'Uploading…' : 'Upload'}
        </Button>
      </FieldGroup>
    </form>
  )
}
