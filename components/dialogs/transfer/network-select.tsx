import * as React from "react"

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { mainnet } from "viem/chains"

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

import { useChain } from "@/hooks/use-chain"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { solana } from "@/lib/viem"

interface NetworkSelectProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  hasEthereumBalance: boolean
  hasSolanaBalance: boolean
}

export function NetworkSelect({
  value,
  onChange,
  hasEthereumBalance,
  hasSolanaBalance,
}: NetworkSelectProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const chain = useChain()

  const networks = React.useMemo(() => {
    const availableNetworks: Array<{ label: string; value: number }> = []

    if (chain) {
      availableNetworks.push({ label: chain.name, value: chain.id })
    }

    if (hasEthereumBalance) {
      availableNetworks.push({ label: "Ethereum", value: mainnet.id })
    }

    if (hasSolanaBalance) {
      availableNetworks.push({ label: "Solana", value: solana.id })
    }

    return availableNetworks
  }, [hasEthereumBalance, hasSolanaBalance, chain])

  return (
    <Popover
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          autoFocus
          aria-expanded={open}
          className={cn(
            "justify-between px-3",
            !value && "text-muted-foreground",
          )}
          role="combobox"
          variant="outline"
        >
          {value
            ? networks.find((network) => network.value === value)?.label
            : chain?.name}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        onOpenAutoFocus={(e) => (!isDesktop ? e.preventDefault() : undefined)}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No network found.</CommandEmpty>
            <CommandGroup>
              {networks.map((network) => (
                <CommandItem
                  key={network.value}
                  value={network.value.toString()}
                  onSelect={(currentValue) => {
                    onChange(
                      Number(currentValue) === value
                        ? undefined
                        : Number(currentValue),
                    )
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{network.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === network.value ? "opacity-100" : "opacity-0",
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
