import React from "react"

import { Token, useWallet } from "@renegade-fi/react"
import { formatUnits, parseUnits } from "viem"

import { NewOrderFormProps } from "@/app/trade/[base]/components/new-order/new-order-form"

import { Button } from "@/components/ui/button"

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
    const priceDecimals = 18
    const priceBigInt = parseUnits(price.toString(), priceDecimals)

    if (isSell) {
      if (isUSDCDenominated) {
        // Selling base token: calculate USDC equivalent of base balance
        const usdcValue =
          (baseBalance * priceBigInt) /
          BigInt(
            10 ** (baseToken.decimals + priceDecimals - quoteToken.decimals),
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
        BigInt(10 ** (baseToken.decimals + priceDecimals - quoteToken.decimals))
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

  console.log("max balance debug ", {
    maxBalance,
  })

  // const shortcut = maxBalance * percentage
  const shortcut = React.useMemo(() => {
    const basisPoints = BigInt(percentage)
    const shortcutBigInt = (maxBalance * basisPoints) / BigInt(100)
    console.log("debug", {
      basisPoints,
      shortcutBigInt,
    })
    return shortcutBigInt
  }, [maxBalance, percentage])

  const isDisabled = !maxBalance

  const formattedShortcut = parseFloat(
    formatUnits(
      shortcut,
      isUSDCDenominated ? quoteToken.decimals : baseToken.decimals,
    ),
  )

  // TODO: [SAFETY] Calculate the minimum fill size of the quote asset and ensure it is greater than the minimum fill size
  // parseAmount(shortcut.toString(), token) < MIN_FILL_SIZE

  return (
    <Button
      variant="outline"
      className={cn(className)}
      onClick={e => {
        e.preventDefault()
        onSetAmount(formattedShortcut)
      }}
      disabled={isDisabled}
      size="sm"
    >
      {percentage === 100 ? "MAX" : `${percentage}%`}
    </Button>
  )
}
