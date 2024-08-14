import { Token, useStatus, useWallet } from "@renegade-fi/react"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useUSDPrice } from "@/hooks/use-usd-price"
import { formatCurrencyFromString, formatNumber } from "@/lib/format"

export function AssetsSectionWithDepositButton({
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
      select: data =>
        !data.balances.find(balance => balance.mint === baseToken.address)
          ?.amount &&
        !data.balances.find(balance => balance.mint === quoteToken.address)
          ?.amount,
    },
  })
  return (
    <div className="flex">
      <div className="flex-1">
        <AssetsSection base={base} quote={quote} />
      </div>
      {data && (
        <TransferDialog mint={baseToken.address}>
          <Button variant="outline" className="ml-6 h-full font-extended">
            Deposit
          </Button>
        </TransferDialog>
      )}
    </div>
  )
}

export function AssetsSection({
  base,
  quote = "USDC",
}: {
  base: string
  quote?: string
}) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker(quote)

  const renegadeStatus = useStatus()

  const { data, status } = useWallet({
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

  const isLoading = status === "pending" || renegadeStatus !== "in relayer"

  const baseBalance = data?.[baseToken.address] ?? BigInt(0)
  const formattedBaseBalance = isLoading
    ? "--"
    : formatNumber(baseBalance, baseToken.decimals, true)
  const baseUsdPrice = useUSDPrice(baseToken, baseBalance)
  const formattedBaseUsdPrice = isLoading
    ? "--"
    : formatCurrencyFromString(baseUsdPrice)

  const quoteBalance = data?.[quoteToken.address] ?? BigInt(0)
  const formattedQuoteBalance = isLoading
    ? "--"
    : formatNumber(quoteBalance, quoteToken.decimals, true)
  const quoteUsdPrice = useUSDPrice(quoteToken, quoteBalance)
  const formattedQuoteUsdPrice = isLoading
    ? "--"
    : formatCurrencyFromString(quoteUsdPrice)

  return (
    <>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <TokenIcon ticker={base} size={16} />
          <TransferDialog mint={baseToken.address}>
            <Button
              variant="link"
              className="text-md h-fit p-0 text-muted-foreground"
              onClick={e => {
                if (renegadeStatus !== "in relayer") e.preventDefault()
              }}
            >
              {base}
            </Button>
          </TransferDialog>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <span>{formattedBaseUsdPrice}</span>
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
              onClick={e => {
                if (renegadeStatus !== "in relayer") e.preventDefault()
              }}
            >
              {quote}
            </Button>
          </TransferDialog>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <span>{formattedQuoteUsdPrice}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{`${formattedQuoteBalance} ${quote}`}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  )
}
