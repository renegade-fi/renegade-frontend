import React from "react"

import { Token, useWallet } from "@renegade-fi/react"
import { formatUnits } from "viem"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { PRICE_DECIMALS } from "@/lib/constants/precision"
import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { safeParseUnits } from "@/lib/format"
import { cn } from "@/lib/utils"
import { usePrice } from "@/stores/price-store"

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
  const { data } = useWallet({
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
  const price = usePrice({
    baseAddress: baseToken.address,
  })

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

  const usdPrice = useUSDPrice(baseToken, shortcut, false)

  const formattedShortcut = React.useMemo(() => {
    if (isUSDCDenominated && shortcut < MIN_FILL_SIZE) {
      return 0
    }
    if (!isUSDCDenominated && usdPrice < MIN_FILL_SIZE) {
      return 0
    }
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
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(className)}
          onClick={(e) => {
            e.preventDefault()
            if (formattedShortcut) {
              onSetAmount(formattedShortcut)
            }
          }}
          disabled={isDisabled}
          size="sm"
        >
          {percentage === 100 ? "MAX" : `${percentage}%`}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-sans">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
