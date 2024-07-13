import { Token, useBalances } from '@renegade-fi/react'

import { TokenIcon } from '@/components/token-icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useUSDPrice } from '@/hooks/use-usd-price'
import { formatCurrency, formatNumber } from '@/lib/format'

export function AssetsSection({
  base,
  quote = 'USDC',
}: {
  base: string
  quote?: string
}) {
  const balances = useBalances()

  const baseToken = Token.findByTicker(base)
  const baseBalance = balances.get(baseToken.address)?.amount
  const formattedBaseBalance = formatNumber(
    baseBalance ?? BigInt(0),
    baseToken.decimals,
  )
  const baseUsdPrice = useUSDPrice(baseToken, baseBalance)

  const quoteToken = Token.findByTicker(quote)
  const quoteBalance = balances.get(quoteToken.address)?.amount
  const formattedQuoteBalance = formatNumber(
    quoteBalance ?? BigInt(0),
    quoteToken.decimals,
  )
  const quoteUsdPrice = useUSDPrice(quoteToken, quoteBalance)

  return (
    <TooltipProvider>
      <div className="p-6">
        <h2 className="mb-4">Your Assets</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <TokenIcon ticker={base} size={20} />
              <span>{base}</span>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <span>{formatCurrency(baseUsdPrice)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{`${formattedBaseBalance} ${base}`}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <TokenIcon ticker={quote} size={20} />
              <span>{quote}</span>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <span>{formatCurrency(quoteUsdPrice)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{`${formattedQuoteBalance} ${quote}`}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
