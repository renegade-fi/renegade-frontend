import * as React from "react"

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"
import { Token, useBackOfQueueWallet } from "@renegade-fi/react"
import { erc20Abi, isAddress } from "viem"
import { useAccount, useReadContracts } from "wagmi"

import { ExternalTransferDirection } from "@/components/dialogs/transfer/transfer-dialog"
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

import { useMediaQuery } from "@/hooks/use-media-query"
import { useRefreshOnBlock } from "@/hooks/use-refresh-on-block"
import { formatNumber } from "@/lib/format"
import { DISPLAY_TOKENS } from "@/lib/token"
import { cn } from "@/lib/utils"

const tokens = DISPLAY_TOKENS().map((token) => ({
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
  const { address } = useAccount()
  const { data: l2Balances, queryKey } = useReadContracts({
    contracts: DISPLAY_TOKENS().map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })),
    query: {
      enabled:
        !!address && open && direction === ExternalTransferDirection.Deposit,
      select: (data) =>
        new Map(
          data.map((balance, index) => [
            DISPLAY_TOKENS()[index].address,
            balance.status === "success" ? BigInt(balance.result) : BigInt(0),
          ]),
        ),
    },
  })

  useRefreshOnBlock({ queryKey })

  const { data: renegadeBalances } = useBackOfQueueWallet({
    query: {
      enabled: open && direction === ExternalTransferDirection.Withdraw,
      select: (data) =>
        new Map(data.balances.map((balance) => [balance.mint, balance.amount])),
    },
  })

  const displayBalances =
    direction === ExternalTransferDirection.Deposit
      ? l2Balances
      : renegadeBalances

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
          className={cn("justify-between", !value && "text-muted-foreground")}
          role="combobox"
          variant="outline"
        >
          {value
            ? tokens.find((framework) => framework.value === value)?.label
            : "Select token"}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        onOpenAutoFocus={(e) => (!isDesktop ? e.preventDefault() : undefined)}
      >
        <Command
          filter={(value, search) => {
            if (!isAddress(value)) return 0
            const token = Token.findByAddress(value)
            if (
              token.name.toLowerCase().includes(search.toLowerCase()) ||
              token.ticker.toLowerCase().includes(search.toLowerCase())
            )
              return 1
            return 0
          }}
        >
          <CommandInput
            className="h-9"
            placeholder="Search for token..."
          />
          <CommandList>
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              {tokens.map((t) => (
                <CommandItem
                  key={t.value}
                  value={t.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <span className="flex-1">{t.label}</span>
                  <span className="flex-1 pr-2 text-right">
                    {formatNumber(
                      displayBalances?.get(t.value) ?? BigInt(0),
                      Token.findByAddress(t.value).decimals,
                    )}
                  </span>
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
