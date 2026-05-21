'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileInfo {
  file: File
  width: number
  height: number
  previewUrl: string
}

export default function UploadDropzone({
  value,
  onChange,
}: {
  value: FileInfo | null
  onChange: (info: FileInfo | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const readDimensions = useCallback(
    (file: File): Promise<{ width: number; height: number }> =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = () => reject(new Error('Failed to read image dimensions'))
        img.src = URL.createObjectURL(file)
      }),
    []
  )

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }
    const { width, height } = await readDimensions(file)
    onChange({ file, width, height, previewUrl: URL.createObjectURL(file) })
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const clear = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl)
    onChange(null)
  }

  if (value) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt="Preview"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{value.file.name}</span>
            <span className="text-muted-foreground">
              {value.width} × {value.height}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X data-icon="inline-start" />
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Upload />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Click to upload</span> or drag and drop
        <br />
        PNG, JPG, WEBP up to 10MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
