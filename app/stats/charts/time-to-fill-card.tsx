import React, { useMemo } from "react"

import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import { Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { TokenSelect } from "@/app/stats/charts/token-select"
import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

import { Slider } from "@/components/ui/slider"

import { useOrderValue } from "@/hooks/use-order-value"
import { usePriceQuery } from "@/hooks/use-price-query"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { safeParseUnits } from "@/lib/format"

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
    <div className="flex flex-col justify-evenly border px-20">
      <NumberFlowGroup>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 text-2xl leading-none">
          {/* <div className="font-serif font-bold">Fill</div> */}
          <NumberFlow
            className="text-right font-serif text-2xl font-bold"
            format={{
              maximumFractionDigits: 2,
            }}
            prefix="Fill  "
            value={Number(priceInBase)}
          />
          <TokenSelect
            value={selectedToken}
            onChange={setSelectedToken}
          />
          <NumberFlow
            className="font-serif font-bold"
            format={{
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            }}
            prefix={`in  ${displayValues.prefix}`}
            suffix={displayValues.suffix}
            value={displayValues.value}
          />
        </div>
        <div className="grid grid-cols-[0.5fr_2fr] items-center gap-4">
          <NumberFlow
            className="text-right font-serif text-2xl font-bold"
            format={{
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
            }}
            value={selectedAmount}
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
      </NumberFlowGroup>
    </div>
  )
}
