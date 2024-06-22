'use client'

import * as React from 'react'

import { formatNumber } from '@/lib/format'
import { useReadErc20BalanceOf } from '@/lib/generated'
import { DISPLAY_TOKENS } from '@/lib/token'
import { cn } from '@/lib/utils'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { Token, useBalances } from '@renegade-fi/react'
import { useAccount } from 'wagmi'

import { ExternalTransferDirection } from '@/components/dialogs/transfer-dialog'
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

const tokens = DISPLAY_TOKENS().map(token => ({
  value: token.address,
  label: token.ticker,
}))

export function TokenSelect({
  direction,
  value,
  onChange,
}: {
  direction: ExternalTransferDirection
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
            : 'Select token'}
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
                  <span className="flex-1 pr-2 text-right">
                    {direction === ExternalTransferDirection.Deposit ? (
                      <L2Balance base={t.value} />
                    ) : (
                      <RenegadeBalance base={t.value} />
                    )}
                  </span>
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

function L2Balance({ base }: { base: `0x${string}` }) {
  const { address } = useAccount()
  const { data: l2Balance } = useReadErc20BalanceOf({
    address: base,
    args: [address ?? '0x'],
    query: {
      enabled: !!base && !!address,
    },
  })
  const formattedL2Balance = formatNumber(
    l2Balance ?? BigInt(0),
    Token.findByAddress(base).decimals,
  )
  return <>{formattedL2Balance}</>
}

function RenegadeBalance({ base }: { base: `0x${string}` }) {
  const balances = useBalances()
  const formattedRenegadeBalance = formatNumber(
    balances.get(base)?.amount ?? BigInt(0),
    Token.findByAddress(base).decimals,
  )
  return <>{formattedRenegadeBalance}</>
}
