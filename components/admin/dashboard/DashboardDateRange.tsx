'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function DashboardDateRange() {
  return (
    <Select defaultValue="28">
      <SelectTrigger className="w-[160px]" size="sm">
        <SelectValue placeholder="Range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7">Last 7 days</SelectItem>
        <SelectItem value="28">Last 28 days</SelectItem>
        <SelectItem value="90">Last 90 days</SelectItem>
      </SelectContent>
    </Select>
  )
}
