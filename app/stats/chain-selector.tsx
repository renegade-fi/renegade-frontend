"use client"

import Image from "next/image"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  AVAILABLE_CHAINS,
  CHAIN_LOGOS,
} from "@/providers/wagmi-provider/config"

interface ChainSelectorProps {
  chainId: number
  onChange: (chainId: number) => void
}

export function ChainSelector({ chainId, onChange }: ChainSelectorProps) {
  const handleChainChange = (value: string) => {
    if (value) {
      const chainId = parseInt(value)
      onChange(chainId)
    }
  }

  return (
    <ToggleGroup
      className="justify-start"
      type="single"
      value={chainId.toString()}
      onValueChange={handleChainChange}
    >
      {AVAILABLE_CHAINS.map((chain) => (
        <ToggleGroupItem
          key={chain.id}
          className="flex items-center gap-2 border-2 px-4 py-2 transition-all hover:bg-accent data-[state=off]:border-transparent data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          value={chain.id.toString()}
        >
          <Image
            alt={`${chain.name} logo`}
            className="shrink-0"
            height={20}
            src={CHAIN_LOGOS[chain.id]}
            width={20}
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
