import { Token, parseAmount, useBalances } from "@renegade-fi/react"

import { Button } from "@/components/ui/button"

import { MIN_FILL_SIZE } from "@/lib/constants/protocol"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

// Percentage should be <= 1
export function AmountShortcutButton({
  base,
  className,
  onSetAmount,
  percentage,
}: {
  base: string
  className?: string
  onSetAmount: (amount: number) => void
  percentage: number
}) {
  const data = useBalances()
  const token = Token.findByTicker(base)
  if (!token) return null

  const balance = data.get(token.address)?.amount ?? BigInt(0)
  const formattedBalance = Number(formatNumber(balance, token.decimals))
  const shortcut = formattedBalance * percentage
  const isDisabled = balance === BigInt(0)

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
