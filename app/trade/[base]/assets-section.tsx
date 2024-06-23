import { formatNumber } from '@/lib/format'
import { Token, useBalances } from '@renegade-fi/react'

import { TokenIcon } from '@/components/token-icon'

export function AssetsSection({
  base,
  quote = 'USDC',
}: {
  base: string
  quote?: string
}) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker(quote)

  const balances = useBalances()
  const baseBalance = balances.get(baseToken.address)?.amount
  const quoteBalance = balances.get(quoteToken.address)?.amount

  const formattedBaseBalance = formatNumber(
    baseBalance ?? BigInt(0),
    baseToken.decimals,
  )
  const formattedQuoteBalance = formatNumber(
    quoteBalance ?? BigInt(0),
    quoteToken.decimals,
  )
  return (
    <div className="p-6">
      <h2 className="mb-4">Your Assets</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={base} size={20} />
            <span>{base}</span>
          </div>
          <span>{formattedBaseBalance}</span>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={quote} size={20} />
            <span>{quote}</span>
          </div>
          <span>{formattedQuoteBalance}</span>
        </div>
      </div>
    </div>
  )
}
