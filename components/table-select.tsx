import * as React from "react"

import { CheckIcon } from "@radix-ui/react-icons"
import { CirclePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { cn } from "@/lib/utils"

export function TableSelect({
  value,
  values,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  values: { value: string; label: string }[]
  placeholder: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("justify-between", !value && "text-muted-foreground")}
          role="combobox"
          size="sm"
          variant="outline"
        >
          <CirclePlus className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {value ? values.find((v) => v.value === value)?.label : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-fit p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {values.map((v) => (
                <CommandItem
                  key={v.value}
                  value={v.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{v.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === v.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
