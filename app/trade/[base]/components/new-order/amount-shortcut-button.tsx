import React from "react"

import { Token, useBackOfQueueWallet } from "@renegade-fi/react"
import { formatUnits, parseUnits } from "viem"

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

// Percentage should be <= 1
export function AmountShortcutButton({
  base,
  className,
  onSetAmount,
  percentage,
  isSell,
  isUSDCDenominated,
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
      if (isUSDCDenominated) {
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
      if (isUSDCDenominated) {
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
    isUSDCDenominated,
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
    if (isUSDCDenominated && shortcut < MIN_FILL_SIZE) {
      return 0
    }
    const formattedUsdPrice = parseFloat(
      formatUnits(usdPrice, baseToken.decimals),
    )
    const minFillSize = parseFloat(
      formatUnits(MIN_FILL_SIZE, quoteToken.decimals),
    )
    if (!isUSDCDenominated && formattedUsdPrice < minFillSize) {
      return 0
    }
    // Adjust by # of other token's decimals
    const value = formatUnits(
      shortcut,
      isUSDCDenominated ? quoteToken.decimals : baseToken.decimals,
    )
    return value
  }, [
    baseToken.decimals,
    isUSDCDenominated,
    quoteToken.decimals,
    shortcut,
    usdPrice,
  ])

  const isDisabled = !formattedShortcut

  let tooltip = `${formattedShortcut} ${isUSDCDenominated ? quoteToken.ticker : baseToken.ticker}`

  return (
    <Tooltip>
      {isDisabled ? (
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button
              disabled
              className={cn(className, "w-full")}
              size="sm"
              type="button"
              variant="outline"
            >
              {percentage === 100 ? "MAX" : `${percentage}%`}
            </Button>
          </span>
        </TooltipTrigger>
      ) : (
        <TooltipTrigger asChild>
          <Button
            className={cn(className)}
            size="sm"
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              if (formattedShortcut) {
                onSetAmount(formattedShortcut)
              }
            }}
          >
            {percentage === 100 ? "MAX" : `${percentage}%`}
          </Button>
        </TooltipTrigger>
      )}
      <TooltipContent>
        <p className="font-sans">{isDisabled ? "< 1 USDC" : tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
