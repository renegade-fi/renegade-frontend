import React from "react"

import { Token, parseAmount, useBalances } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"

import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { usePrice } from "@/stores/price-store"

interface AmountShortcutButtonProps extends NewOrderFormProps {
  className?: string
  onSetAmount: (amount: number) => void
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
  const data = useBalances()
  const token = Token.findByTicker(base)
  const quoteToken = Token.findByTicker("USDC")
  const price = usePrice({
    baseAddress: token.address,
  })

  const maxBalance = React.useMemo(() => {
    const baseBalance = data.get(token.address)?.amount ?? BigInt(0)
    const quoteBalance = data.get(quoteToken.address)?.amount ?? BigInt(0)
    const formattedBaseBalance = Number(
      formatNumber(baseBalance, token.decimals),
    )
    const formattedQuoteBalance = Number(
      formatNumber(quoteBalance, quoteToken.decimals),
    )
    if (!price) return 0
    if (isSell) {
      if (isUSDCDenominated) {
        return formattedBaseBalance * price
      }
      return formattedBaseBalance
    }
    if (isUSDCDenominated) {
      return formattedQuoteBalance
    }
    return formattedQuoteBalance / price
  }, [
    data,
    isSell,
    isUSDCDenominated,
    price,
    quoteToken.address,
    quoteToken.decimals,
    token.address,
    token.decimals,
  ])

  const shortcut = maxBalance * percentage
  const isDisabled = maxBalance === 0

  // TODO: [SAFETY] Calculate the minimum fill size of the quote asset and ensure it is greater than the minimum fill size
  // parseAmount(shortcut.toString(), token) < MIN_FILL_SIZE

  return (
    <Button
      variant="outline"
      className={cn(className)}
      onClick={e => {
        e.preventDefault()
        onSetAmount(shortcut)
      }}
      disabled={isDisabled}
    >
      {percentage === 1 ? "MAX" : `${percentage * 100}%`}
    </Button>
  )
}
