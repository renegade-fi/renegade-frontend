import React from "react"

import { Token, useWallet } from "@renegade-fi/react"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"

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
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker("USDC")
  const { data } = useWallet({
    query: {
      select: data => ({
        [baseToken.address]: data.balances.find(
          balance => balance.mint === baseToken.address,
        )?.amount,
        [quoteToken.address]: data.balances.find(
          balance => balance.mint === quoteToken.address,
        )?.amount,
      }),
    },
  })
  const price = usePrice({
    baseAddress: baseToken.address,
  })

  const maxBalance = React.useMemo(() => {
    const baseBalance = data?.[baseToken.address] ?? BigInt(0)
    const quoteBalance = data?.[quoteToken.address] ?? BigInt(0)

    if (!price) return 0
    if (isSell) {
      const formattedBaseBalance = Number(
        formatNumber(baseBalance, baseToken.decimals),
      )
      if (isUSDCDenominated) {
        return formattedBaseBalance * price
      }
      return formattedBaseBalance
    }

    const formattedQuoteBalance = Number(
      formatNumber(quoteBalance, quoteToken.decimals),
    )
    if (isUSDCDenominated) {
      return formattedQuoteBalance
    }
    return formattedQuoteBalance / price
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
