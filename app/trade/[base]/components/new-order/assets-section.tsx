import { Token, useWallet } from "@renegade-fi/react"

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
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker(quote)

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

  const baseBalance = data?.[baseToken.address] ?? BigInt(0)
  const formattedBaseBalance = formatNumber(baseBalance, baseToken.decimals)
  const baseUsdPrice = useUSDPrice(baseToken, baseBalance)

  const quoteBalance = data?.[quoteToken.address] ?? BigInt(0)
  const formattedQuoteBalance = formatNumber(quoteBalance, quoteToken.decimals)
  const quoteUsdPrice = useUSDPrice(quoteToken, quoteBalance)

  return (
    <>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <TokenIcon ticker={base} size={16} />
          <TransferDialog mint={baseToken.address}>
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
          <TransferDialog mint={quoteToken.address}>
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
    </>
  )
}
