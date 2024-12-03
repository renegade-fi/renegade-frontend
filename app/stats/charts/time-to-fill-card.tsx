import React, { useMemo } from "react"

import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import { Token } from "@renegade-fi/react"
import { Check, ChevronsUpDown } from "lucide-react"
import { formatUnits } from "viem/utils"

import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

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
import { Slider } from "@/components/ui/slider"

import { useOrderValue } from "@/hooks/use-order-value"
import { usePriceQuery } from "@/hooks/use-price-query"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { safeParseUnits } from "@/lib/format"
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
          className="w-full font-serif text-2xl font-bold"
          role="combobox"
          size="xl"
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

interface TimeDisplayValues {
  value: number
  prefix: string
  suffix: string
}

export function TimeToFillCard() {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(10000)
  const [selectedToken, setSelectedToken] = React.useState("WETH")
  const [isQuoteCurrency, setIsQuoteCurrency] = React.useState(true)

  const baseToken = Token.findByTicker(selectedToken)
  const { data: usdPerBase } = usePriceQuery(baseToken.address)

  const { priceInBase } = useOrderValue({
    amount: selectedAmount.toString(),
    base: selectedToken,
    isQuoteCurrency,
    isSell: false,
  })
  console.log("🚀 ~ TimeToFillCard ~ priceInBase:", priceInBase)

  // Calculate amount in USD
  const amountInUSD = useMemo(() => {
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
    return Number(
      formatUnits(
        amountTimesPrice(parsedAmount, usdPerBase),
        baseToken.decimals,
      ),
    )
  }, [selectedAmount, baseToken.decimals, isQuoteCurrency, usdPerBase])

  const timeToFillMs = useTimeToFill({
    amount: amountInUSD,
    baseToken: selectedToken,
  })

  const displayValues = useMemo<TimeDisplayValues>(() => {
    const timeInMinutes = timeToFillMs / (1000 * 60)

    if (timeInMinutes >= 60) {
      const timeInHours = timeInMinutes / 60
      const roundedHours = Math.round(timeInHours)
      return {
        value: roundedHours,
        prefix: "~",
        suffix: roundedHours === 1 ? " hour" : " hours",
      }
    }

    return {
      value: timeInMinutes < 1 ? 1 : timeInMinutes,
      prefix: timeInMinutes < 1 ? "< " : "~",
      suffix: timeInMinutes < 1 || timeInMinutes === 1 ? " minute" : " minutes",
    }
  }, [timeToFillMs])

  return (
    <NumberFlowGroup>
      <div className="container flex flex-1 flex-col items-center justify-center gap-4 border">
        <div className="text-lg leading-none text-muted-foreground">Fill</div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline">
            <NumberFlow
              className="font-serif text-2xl font-bold leading-none"
              format={{
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }}
              value={selectedAmount}
            />
            &nbsp;
            <NumberFlow
              className={cn("text-sm text-muted-foreground")}
              format={{
                maximumFractionDigits: 2,
              }}
              prefix="("
              suffix={` ${selectedToken})`}
              value={Number(priceInBase)}
            />
          </div>
        </div>
        <div className="w-full">
          <Slider
            max={1000000}
            step={10000}
            value={[selectedAmount]}
            onValueChange={([value]) => setSelectedAmount(value)}
          />
        </div>
        <div className="flex w-full flex-col items-center gap-1">
          <div className="text-lg leading-none text-muted-foreground">of</div>
          <TokenSelect
            value={selectedToken}
            onChange={setSelectedToken}
          />
          <div className="text-lg leading-none text-muted-foreground">in</div>
        </div>
        <NumberFlow
          className="font-serif text-2xl font-bold leading-none"
          format={{
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          }}
          prefix={displayValues.prefix}
          suffix={displayValues.suffix}
          value={displayValues.value}
        />
      </div>
    </NumberFlowGroup>
  )
}
