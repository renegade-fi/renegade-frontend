import * as React from 'react'

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { DISPLAY_TOKENS } from '@/lib/token'
import { cn } from '@/lib/utils'

const tokens = DISPLAY_TOKENS().map(token => ({
  value: token.address,
  label: token.ticker,
}))

export function TokenSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', !value && 'text-muted-foreground')}
        >
          {value
            ? tokens.find(framework => framework.value === value)?.label
            : 'Filter by Asset'}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search for token..." className="h-9" />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map(t => (
                <CommandItem
                  key={t.value}
                  value={t.value}
                  onSelect={currentValue => {
                    onChange(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{t.label}</span>
                  <CheckIcon
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === t.value ? 'opacity-100' : 'opacity-0',
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