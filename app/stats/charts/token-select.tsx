import React from "react"

import { Check, ChevronsUpDown } from "lucide-react"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { DISPLAY_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"

const tokens = DISPLAY_TOKENS({ hideHidden: true, hideStables: true }).map(
  (token) => ({
    value: token.ticker,
    label: token.ticker,
  }),
)

type TokenSelectProps = {
  value: string
  onChange: (value: string) => void
}

export function TokenSelect({ value, onChange }: TokenSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="px-2 font-serif text-2xl font-bold"
          role="combobox"
          //   size="xl"
          type="button"
          variant="ghost"
        >
          <TokenIcon
            className="mr-2"
            size={22}
            ticker={value}
          />
          {value
            ? tokens.find((token) => token.value === value)?.label
            : "Select token"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search token..." />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map((token) => (
                <CommandItem
                  key={token.value}
                  value={token.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === token.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {token.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
