import * as React from "react"

import Image from "next/image"

import { CheckIcon } from "@radix-ui/react-icons"
import { ChainId } from "@renegade-fi/react/constants"
import { ChevronDown } from "lucide-react"
import { useSwitchChain } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { env } from "@/env/client"
import { cn } from "@/lib/utils"
import { useCurrentChain } from "@/providers/state-provider/hooks"
import { useServerStore } from "@/providers/state-provider/server-store-provider"
import {
  MAINNET_CHAINS,
  TESTNET_CHAINS,
} from "@/providers/wagmi-provider/config"

const values = (
  env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet"
    ? MAINNET_CHAINS
    : TESTNET_CHAINS
).map((chain) => ({
  value: chain.id,
  label: chain.name.split(" ")[0],
  icon: `/${chain.name.split(" ")[0].toLowerCase()}.svg`,
}))

export function ChainSelector() {
  const [open, setOpen] = React.useState(false)
  const currentChainId = useCurrentChain()
  const setChainId = useServerStore((s) => s.setChainId)
  const { switchChain } = useSwitchChain()

  return (
    <Popover
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="justify-between"
          role="combobox"
          size="default"
          variant="outline"
        >
          <Image
            alt={values.find((v) => v.value === currentChainId)?.label ?? ""}
            className="mr-2 h-4 w-4 shrink-0"
            height={16}
            src={values.find((v) => v.value === currentChainId)?.icon ?? ""}
            width={16}
          />
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-fit p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {values.map((v) => (
                <CommandItem
                  key={v.value}
                  value={v.value.toString()}
                  onSelect={(currentValue) => {
                    const chainId = Number.parseInt(currentValue) as ChainId
                    switchChain({ chainId })
                    setChainId(chainId)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{v.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentChainId === v.value ? "opacity-100" : "opacity-0",
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
