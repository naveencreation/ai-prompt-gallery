'use client'

import { useState, useRef } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function TagCombobox({
  value,
  onChange,
  suggestions,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setOpen(false)
  }

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const available = suggestions.filter((s) => !value.includes(s))

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-ring"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-sm font-normal text-muted-foreground"
          >
            <Check className="mr-2 size-4 opacity-50" />
            Add tag...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Search or create tag..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value
                  if (val) {
                    e.preventDefault()
                    add(val)
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
            <CommandList>
              <CommandEmpty>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    const val = inputRef.current?.value ?? ''
                    if (val) add(val)
                  }}
                >
                  Create &quot;{inputRef.current?.value ?? ''}&quot;
                </button>
              </CommandEmpty>
              <CommandGroup>
                {available.map((s) => (
                  <CommandItem
                    key={s}
                    onSelect={() => add(s)}
                    className={cn(value.includes(s) && 'opacity-50')}
                  >
                    <Check
                      className={cn('mr-2 size-4', value.includes(s) ? 'opacity-100' : 'opacity-0')}
                    />
                    {s}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
