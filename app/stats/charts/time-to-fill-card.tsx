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
          className="px-2 font-serif text-2xl font-bold"
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
    includeVolumeLimit: true,
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
    <div className="w-full border p-4">
      <NumberFlowGroup>
        <div className="mx-auto max-w-2xl">
          <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr] place-items-center text-2xl leading-none">
            <div className="text-muted-foreground">Fill</div>
            <NumberFlow
              className="font-serif font-bold"
              format={{
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }}
              value={selectedAmount}
            />
            <div className="text-muted-foreground">of</div>
            <TokenSelect
              value={selectedToken}
              onChange={setSelectedToken}
            />
            <div className="text-muted-foreground">in</div>
            <NumberFlow
              className="font-serif font-bold"
              format={{
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
              }}
              prefix={displayValues.prefix}
              suffix={displayValues.suffix}
              value={displayValues.value}
            />
          </div>
          <div className="grid grid-cols-[1fr_2fr] items-center">
            <NumberFlow
              className="font-serif text-2xl font-bold"
              format={{
                maximumFractionDigits: 2,
              }}
              suffix={` ${selectedToken}`}
              value={Number(priceInBase)}
            />
            <div className="w-full">
              <Slider
                max={1000000}
                step={10000}
                value={[selectedAmount]}
                onValueChange={([value]) => setSelectedAmount(value)}
              />
            </div>
          </div>
        </div>
      </NumberFlowGroup>
    </div>
  )
}
