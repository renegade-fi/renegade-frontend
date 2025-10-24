"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange?.(selectedDate.toISOString().split('T')[0])
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between font-normal text-sm h-9 ${className}`}
        >
          {date ? date.toLocaleDateString() : "Select date"}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          onSelect={handleDateSelect}
        />
      </PopoverContent>
    </Popover>
  )
}
