import { Token, useBalances } from "@renegade-fi/react"

import { TransferDialog } from "@/components/dialogs/transfer-dialog"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { formatCurrency, formatNumber } from "@/lib/format"

export function AssetsSection({
  base,
  quote = "USDC",
}: {
  base: string
  quote?: string
}) {
  const balances = useBalances()

  const baseToken = Token.findByTicker(base)
  const baseBalance = balances.get(baseToken.address)?.amount || BigInt(0)
  const formattedBaseBalance = formatNumber(baseBalance, baseToken.decimals)
  const baseUsdPrice = useUSDPrice(baseToken, baseBalance)

  const quoteToken = Token.findByTicker(quote)
  const quoteBalance = balances.get(quoteToken.address)?.amount || BigInt(0)
  const formattedQuoteBalance = formatNumber(quoteBalance, quoteToken.decimals)
  const quoteUsdPrice = useUSDPrice(quoteToken, quoteBalance)

  return (
    <TooltipProvider>
      <div className="text-sm">
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <TokenIcon ticker={base} size={16} />
            <TransferDialog base={baseToken.address}>
              <Button
                variant="link"
                className="text-md h-fit p-0 text-muted-foreground"
              >
                {base}
              </Button>
            </TransferDialog>
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
            <TokenIcon ticker={quote} size={16} />
            <TransferDialog base={quoteToken.address}>
              <Button
                variant="link"
                className="text-md h-fit p-0 text-muted-foreground"
              >
                {quote}
              </Button>
            </TransferDialog>
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
    </TooltipProvider>
  )
}
