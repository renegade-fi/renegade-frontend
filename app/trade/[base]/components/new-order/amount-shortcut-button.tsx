import React from "react"

import { useBackOfQueueWallet } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { formatUnits } from "viem"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { usePriceQuery } from "@/hooks/use-price-query"
import { useUSDPrice } from "@/hooks/use-usd-price"
import { PRICE_DECIMALS } from "@/lib/constants/precision"
import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AmountShortcutButtonProps extends NewOrderFormProps {
  className?: string
  onSetAmount: (amount: string) => void
  percentage: number
}

// Percentage should be 25, 50, 100, etc.
export function AmountShortcutButton({
  base,
  className,
  onSetAmount,
  percentage,
  isSell,
  isQuoteCurrency,
}: AmountShortcutButtonProps) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker("USDC")
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) => ({
        [baseToken.address]: data.balances.find(
          (balance) => balance.mint === baseToken.address,
        )?.amount,
        [quoteToken.address]: data.balances.find(
          (balance) => balance.mint === quoteToken.address,
        )?.amount,
      }),
    },
  })
  const { data: price } = usePriceQuery(baseToken.address)

  const maxBalance = React.useMemo(() => {
    if (!price) return BigInt(0)
    const baseBalance = data?.[baseToken.address] ?? BigInt(0)
    const quoteBalance = data?.[quoteToken.address] ?? BigInt(0)
    const priceBigInt = safeParseUnits(price, PRICE_DECIMALS)
    if (priceBigInt instanceof Error) return BigInt(0)

    if (isSell) {
      if (isQuoteCurrency) {
        // Selling base token: calculate USDC equivalent of base balance
        const usdcValue =
          (baseBalance * priceBigInt) /
          BigInt(
            10 ** (baseToken.decimals + PRICE_DECIMALS - quoteToken.decimals),
          )
        return usdcValue
      } else {
        // Selling base token: return the entire base balance
        return baseBalance
      }
    } else {
      // Buying base token: calculate how much base can be bought with the quote balance
      const numerator =
        quoteBalance *
        BigInt(
          10 ** (baseToken.decimals + PRICE_DECIMALS - quoteToken.decimals),
        )
      const baseAmount = numerator / priceBigInt
      if (isQuoteCurrency) {
        // Convert base amount back to USDC
        return quoteBalance
      } else {
        return baseAmount
      }
    }
  }, [
    baseToken.address,
    baseToken.decimals,
    data,
    isSell,
    isQuoteCurrency,
    price,
    quoteToken.address,
    quoteToken.decimals,
  ])

  const shortcut = React.useMemo(() => {
    const basisPoints = BigInt(percentage)
    const shortcutBigInt = (maxBalance * basisPoints) / BigInt(100)
    return shortcutBigInt
  }, [maxBalance, percentage])

  const usdPrice = useUSDPrice(baseToken, shortcut)

  const formattedShortcut = React.useMemo(() => {
    if (isQuoteCurrency && shortcut < MIN_FILL_SIZE) {
      return 0
    }
    const formattedUsdPrice = parseFloat(
      formatUnits(usdPrice, baseToken.decimals),
    )
    const minFillSize = parseFloat(
      formatUnits(MIN_FILL_SIZE, quoteToken.decimals),
    )
    if (!isQuoteCurrency && formattedUsdPrice < minFillSize) {
      return 0
    }
    // Adjust by # of other token's decimals
    const value = formatUnits(
      shortcut,
      isQuoteCurrency ? quoteToken.decimals : baseToken.decimals,
    )
    return value
  }, [
    baseToken.decimals,
    isQuoteCurrency,
    quoteToken.decimals,
    shortcut,
    usdPrice,
  ])

  const isDisabled = !formattedShortcut || parseFloat(formattedShortcut) === 0

  let tooltip = `${formattedShortcut} ${isQuoteCurrency ? quoteToken.ticker : baseToken.ticker}`
  if (isDisabled) {
    tooltip = "<1 USDC"
  }

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        className={cn(isDisabled && "cursor-not-allowed")}
      >
        <span>
          <Button
            className={cn("w-full", className)}
            disabled={isDisabled}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => {
              if (!isDisabled && formattedShortcut) {
                onSetAmount(formattedShortcut)
              }
            }}
          >
            {percentage === 100 ? "MAX" : `${percentage}%`}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
