import React, { useMemo } from "react"

import { Token } from "@renegade-fi/react"
import { ArrowRightLeft, Check, ChevronsUpDown } from "lucide-react"
import { formatUnits } from "viem/utils"

import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

import { NumberInput } from "@/components/number-input"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

import { usePriceQuery } from "@/hooks/use-price-query"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { formatCurrency, formatDuration, safeParseUnits } from "@/lib/format"
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

function TokenSelect({ value, onChange }: TokenSelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="flex-1 font-serif text-2xl font-bold"
          role="combobox"
          size="xl"
          type="button"
          variant="outline"
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

export function TimeToFillCard() {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(10000)
  const [selectedToken, setSelectedToken] = React.useState("WETH")
  const [isQuoteCurrency, setIsQuoteCurrency] = React.useState(true)

  const baseToken = Token.findByTicker(selectedToken)
  const { data: usdPerBase } = usePriceQuery(baseToken.address)

  // Calculate amount in USD
  const amountInUSD = useMemo(() => {
    console.log("enter amount in usd debug", {
      selectedAmount,
      usdPerBase,
      isQuoteCurrency,
    })
    if (!usdPerBase) return selectedAmount
    if (isQuoteCurrency) {
      return selectedAmount
    }
    const parsedAmount = safeParseUnits(
      selectedAmount.toString(),
      baseToken.decimals,
    )
    if (parsedAmount instanceof Error) {
      return selectedAmount
    }
    console.log("amount in usd debug", {
      amount: selectedAmount,
      usdPerBase,
      amountInUSD: Number(
        formatUnits(
          amountTimesPrice(parsedAmount, usdPerBase),
          baseToken.decimals,
        ),
      ),
    })
    return Number(
      formatUnits(
        amountTimesPrice(parsedAmount, usdPerBase),
        baseToken.decimals,
      ),
    )
  }, [selectedAmount, baseToken.decimals, isQuoteCurrency, usdPerBase])

  const timeToFillMs = useTimeToFill({
    amount: amountInUSD,
  })

  const humanizedDuration = useMemo(() => {
    if (!timeToFillMs) return "0 minutes"
    return formatDuration(timeToFillMs)
  }, [timeToFillMs])

  const formattedUSDAmount = formatCurrency(amountInUSD)

  return (
    <Card className="rounded-none">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <div className="flex items-center gap-2">
            <CardTitle className="font-serif text-4xl font-bold tracking-tighter lg:tracking-normal">
              {selectedAmount === 0 ? (
                "Select an amount"
              ) : timeToFillMs !== undefined ? (
                humanizedDuration
              ) : (
                <Skeleton className="h-10 w-40" />
              )}
            </CardTitle>
          </div>
          <CardDescription>
            Estimated Time to Fill {formattedUSDAmount} of {selectedToken}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="flex">
          <TokenSelect
            value={selectedToken}
            onChange={setSelectedToken}
          />
        </div>
        <div>
          <Label className="font-sans text-muted-foreground">Amount</Label>
          <div className="flex">
            <NumberInput
              className="h-12 flex-1 rounded-none border-none px-0 text-right font-mono text-2xl placeholder:text-right focus-visible:ring-0"
              placeholder="0.00"
              type="number"
              value={selectedAmount.toString()}
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
            />
            <Button
              className="h-12 rounded-none px-2 py-0 font-serif text-2xl font-bold tracking-tighter lg:tracking-normal"
              type="button"
              variant="ghost"
              onClick={() => setIsQuoteCurrency(!isQuoteCurrency)}
            >
              {isQuoteCurrency ? "USDC" : selectedToken}
              <ArrowRightLeft className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
