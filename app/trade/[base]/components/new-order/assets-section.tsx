import { Token, useBackOfQueueWallet, useStatus } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { TransferDialog } from "@/components/dialogs/transfer/transfer-dialog"
import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"

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
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        !data.balances.find((balance) => balance.mint === baseToken.address)
          ?.amount &&
        !data.balances.find((balance) => balance.mint === quoteToken.address)
          ?.amount,
    },
  })
  return (
    <div className="flex">
      <div className="flex-1">
        <AssetsSection
          base={base}
          quote={quote}
        />
      </div>
      {data && (
        <TransferDialog mint={baseToken.address}>
          <Button
            className="ml-6 h-full font-extended"
            variant="outline"
          >
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
  disabled = false,
}: {
  base: string
  quote?: string
  disabled?: boolean
}) {
  const baseToken = Token.findByTicker(base)
  const quoteToken = Token.findByTicker(quote)

  const renegadeStatus = useStatus()

  const { data, status } = useBackOfQueueWallet({
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

  const isLoading = status === "pending" || renegadeStatus !== "in relayer"

  const baseBalance = data?.[baseToken.address] ?? BigInt(0)
  const formattedBaseBalance = isLoading
    ? "--"
    : formatNumber(baseBalance, baseToken.decimals, true)
  const baseUsdPrice = useUSDPrice(baseToken, baseBalance)
  // baseBalance is in base decimals, so adjust by base decimals
  const formattedBaseUsdPrice = formatUnits(baseUsdPrice, baseToken.decimals)
  const formattedBaseUsdPriceLabel = isLoading
    ? "--"
    : formatCurrencyFromString(formattedBaseUsdPrice)

  const quoteBalance = data?.[quoteToken.address] ?? BigInt(0)
  const formattedQuoteBalance = isLoading
    ? "--"
    : formatNumber(quoteBalance, quoteToken.decimals, true)
  const quoteUsdPrice = useUSDPrice(quoteToken, quoteBalance)
  // quoteBalance is in quote decimals, so adjust by quote decimals
  const formattedQuoteUsdPrice = formatUnits(quoteUsdPrice, quoteToken.decimals)
  const formattedQuoteUsdPriceLabel = isLoading
    ? "--"
    : formatCurrencyFromString(formattedQuoteUsdPrice)

  return (
    <>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <TokenIcon
            size={16}
            ticker={base}
          />
          <TransferDialog mint={baseToken.address}>
            <Button
              className="text-md h-fit p-0 text-muted-foreground"
              disabled={renegadeStatus !== "in relayer"}
              variant="link"
              onClick={(e) => {
                if (renegadeStatus !== "in relayer" || disabled)
                  e.preventDefault()
              }}
            >
              {base}
            </Button>
          </TransferDialog>
        </div>
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger>
            <span>{formattedBaseUsdPriceLabel}</span>
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent side="right">
            <p>{`${formattedBaseBalance} ${base}`}</p>
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <TokenIcon
            size={16}
            ticker={quote}
          />
          <TransferDialog mint={quoteToken.address}>
            <Button
              className="text-md h-fit p-0 text-muted-foreground"
              disabled={renegadeStatus !== "in relayer"}
              variant="link"
              onClick={(e) => {
                if (renegadeStatus !== "in relayer" || disabled)
                  e.preventDefault()
              }}
            >
              {quote}
            </Button>
          </TransferDialog>
        </div>
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger>
            <span>{formattedQuoteUsdPriceLabel}</span>
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent side="right">
            <p>{`${formattedQuoteBalance} ${quote}`}</p>
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
    </>
  )
}
