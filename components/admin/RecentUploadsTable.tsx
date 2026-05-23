'use client'

import { MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RecentUpload } from '@/lib/services/dashboardService'
import { relativeTime } from '@/lib/utils/time'

interface RecentUploadsTableProps {
  uploads: RecentUpload[]
}

export function RecentUploadsTable({ uploads }: RecentUploadsTableProps) {
  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">No uploads yet</p>
        <p className="text-xs text-muted-foreground mt-1">Get started by uploading your first image</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b bg-muted/50">
              <TableHead className="w-12 px-2">
                <input
                  type="checkbox"
                  className="rounded border-input"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-16 px-2">Image</TableHead>
              <TableHead className="flex-1 px-2">Name & Prompt</TableHead>
              <TableHead className="w-24 px-2 text-center">Status</TableHead>
              <TableHead className="w-20 px-2 text-right">Date</TableHead>
              <TableHead className="w-10 px-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow
                key={upload.id}
                className="border-b hover:bg-muted/50 transition-colors last:border-b-0"
              >
                <TableCell className="px-2">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    aria-label={`Select ${upload.slug}`}
                  />
                </TableCell>
                <TableCell className="px-2">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {upload.imageUrl ? (
                      <Image
                        src={upload.imageUrl}
                        alt={upload.slug}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted-foreground/10 flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium text-sm truncate text-foreground">{upload.slug}</p>
                    <p className="text-xs text-muted-foreground truncate line-clamp-1">{upload.prompt}</p>
                  </div>
                </TableCell>
                <TableCell className="px-2 text-center">
                  <Badge
                    variant={upload.isPublished ? 'default' : 'secondary'}
                    className="text-xs font-semibold capitalize whitespace-nowrap"
                  >
                    {upload.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell className="px-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                  {relativeTime(upload.createdAt)}
                </TableCell>
                <TableCell className="px-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={`Actions for ${upload.slug}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
