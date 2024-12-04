import React, { useMemo } from "react"

import NumberFlow, { NumberFlowGroup } from "@number-flow/react"
import { Token } from "@renegade-fi/react"

import { TokenSelect } from "@/app/stats/charts/token-select"
import { useTimeToFill } from "@/app/stats/hooks/use-time-to-fill"

import { Slider } from "@/components/animated-slider"

import { useOrderValue } from "@/hooks/use-order-value"
import { usePriceQuery } from "@/hooks/use-price-query"

interface TimeDisplayValues {
  value: number
  prefix: string
  suffix: string
}

export function TimeToFillCard() {
  const [selectedAmount, setSelectedAmount] = React.useState<number>(10000)
  const [selectedToken, setSelectedToken] = React.useState("WETH")
  const [isSell, setIsSell] = React.useState(true)

  const baseToken = Token.findByTicker(selectedToken)

  const { priceInBase, priceInUsd } = useOrderValue({
    amount: selectedAmount.toString(),
    base: selectedToken,
    isQuoteCurrency: true,
    isSell,
  })

  const timeToFillMs = useTimeToFill({
    amount: Number(priceInUsd),
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
    <NumberFlowGroup>
      <div className="grid grid-cols-[1fr_auto_1fr_2fr_auto] items-center gap-4 pr-32 text-2xl leading-none">
        <NumberFlow
          className="cursor-pointer text-right font-serif text-2xl font-bold"
          format={{
            maximumFractionDigits: 2,
          }}
          prefix={`${isSell ? "Sell" : "Buy"}  `}
          value={Number(priceInBase)}
          onClick={() => setIsSell((prev) => !prev)}
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
        {/* TODO: Implement when zustand persistent storage is merged in */}
        {/* <Button variant="secondary">
          Place Order <ArrowRightIcon className="ml-2 size-4" />
        </Button> */}
      </div>
    </NumberFlowGroup>
  )
}
