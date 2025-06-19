import React, { useMemo, useRef } from "react"

import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import { useDebounceValue } from "usehooks-ts"

import { TokenSelect } from "@/app/stats/charts/token-select"
import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

import { Slider } from "@/components/animated-slider"
import { Skeleton } from "@/components/ui/skeleton"

import { useOrderValue } from "@/hooks/use-order-value"
import { resolveTicker } from "@/lib/token"
import { cn } from "@/lib/utils"

interface TimeDisplayValues {
  value: number
  prefix: string
  suffix: string
}

export function TimeToFillCard({ chainId }: { chainId: number }) {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(10000)
  const [selectedToken, setSelectedToken] = React.useState("WETH")
  const [isSell, setIsSell] = React.useState(true)

  const { valueInQuoteCurrency, valueInBaseCurrency } = useOrderValue({
    amount: selectedAmount.toString(),
    base: resolveTicker(selectedToken).address,
    isQuoteCurrency: true,
    isSell,
  })

  const [debouncedUsdValue] = useDebounceValue(valueInQuoteCurrency, 1000)

  const tokenChainId = useMemo(() => {
    return resolveTicker(selectedToken).chain ?? 0 // We should always find a chain
  }, [selectedToken])

  const { data: timeToFillMs } = useTimeToFill({
    amount: debouncedUsdValue,
    mint: resolveTicker(selectedToken).address,
    chainId: tokenChainId,
  })

  const lastValidValue = useRef<TimeDisplayValues>({
    value: 0,
    prefix: "",
    suffix: "",
  })

  const displayValues = useMemo<TimeDisplayValues>(() => {
    // Ensure NumberFlow doesn't flash 0 when
    // 1. user sets amount to zero or
    // 2. new estimate is loading
    if (!timeToFillMs && lastValidValue.current.value !== 0) {
      return lastValidValue.current
    }

    if (!timeToFillMs) {
      return {
        value: 0,
        prefix: "",
        suffix: "",
      }
    }

    const timeInMinutes = timeToFillMs / (1000 * 60)
    let result: TimeDisplayValues

    if (timeInMinutes >= 60) {
      const timeInHours = timeInMinutes / 60
      const roundedHours = Number(timeInHours.toFixed(1))
      result = {
        value: roundedHours,
        prefix: "in  ~",
        suffix: roundedHours === 1 ? " hour" : " hours",
      }
    } else {
      const roundedMinutes = Math.round(timeInMinutes)
      result = {
        value: roundedMinutes < 1 ? 1 : roundedMinutes,
        prefix: `in  ${roundedMinutes < 1 ? "< " : "~"}`,
        suffix: roundedMinutes === 1 ? " minute" : " minutes",
      }
    }

    lastValidValue.current = result
    return result
  }, [timeToFillMs])

  return (
    <NumberFlowGroup>
      <div className="grid grid-cols-1 place-items-center items-center gap-16 text-2xl leading-none md:grid-cols-[1fr_auto_1fr_2fr_auto] md:gap-4 lg:pr-32">
        <div className="relative col-span-1 md:col-span-3">
          <div
            className={cn(
              "absolute inset-0 text-center text-base text-gray-500 transition-all duration-200",
              selectedAmount === 0
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            Use the slider to set an amount and see estimated time to fill
          </div>
          <div
            className={cn(
              "grid grid-cols-1 gap-4 transition-all duration-200 sm:grid-cols-[1fr_auto_1fr]",
              selectedAmount === 0
                ? "pointer-events-none opacity-0"
                : "pointer-events-auto opacity-100",
            )}
          >
            {Number(valueInBaseCurrency) ? (
              <NumberFlow
                className="text-center font-serif text-2xl font-bold sm:text-right"
                format={{
                  maximumFractionDigits: 2,
                }}
                prefix={`${isSell ? "Sell" : "Buy"}  `}
                value={Number(valueInBaseCurrency)}
                onClick={() => setIsSell((prev) => !prev)}
              />
            ) : (
              <Skeleton className="h-8 w-32" />
            )}
            <TokenSelect
              chainId={chainId}
              value={selectedToken}
              onChange={setSelectedToken}
            />
            {displayValues.value ? (
              <NumberFlow
                className="text-center font-serif font-bold sm:text-left"
                prefix={`${displayValues.prefix}`}
                suffix={displayValues.suffix}
                value={displayValues.value}
              />
            ) : (
              <Skeleton className="h-8 w-32" />
            )}
          </div>
        </div>
        <div className="col-span-1 w-2/3 md:w-full">
          <Slider
            max={1000000}
            numberFlowClassName="text-right font-serif text-2xl font-bold"
            numberFlowFormat={{
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }}
            step={10000}
            value={[selectedAmount]}
            onValueChange={([value]) => setSelectedAmount(value)}
          />
        </div>
      </div>
    </NumberFlowGroup>
  )
}
