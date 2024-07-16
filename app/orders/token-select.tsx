import * as React from 'react'

import { CheckIcon } from '@radix-ui/react-icons'
import { CirclePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
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
          size="sm"
        >
          <CirclePlus className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {value
            ? tokens.find(framework => framework.value === value)?.label
            : 'Asset'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-28 p-0">
        <Command>
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
