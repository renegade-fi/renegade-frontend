import * as React from "react"

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { mainnet } from "viem/chains"
import { useAccount } from "wagmi"

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

import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { chain } from "@/lib/viem"

const networks = [
  {
    label: "Arbitrum",
    value: chain.id,
  },
  {
    label: "Ethereum",
    value: mainnet.id,
  },
]

export function NetworkSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const { address } = useAccount()

  const isDesktop = useMediaQuery("(min-width: 1024px)")

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
            : "Select network"}
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
              {networks.map((t) => (
                <CommandItem
                  key={t.value}
                  value={t.value.toString()}
                  onSelect={(currentValue) => {
                    onChange(
                      Number(currentValue) === value
                        ? chain.id
                        : Number(currentValue),
                    )
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{t.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === t.value ? "opacity-100" : "opacity-0",
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
