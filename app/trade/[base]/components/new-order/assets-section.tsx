import { useBackOfQueueWallet } from "@renegade-fi/react"
import { ChainId } from "@renegade-fi/react/constants"
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
import { useWallets } from "@/hooks/use-wallets"
import { formatCurrencyFromString, formatNumber } from "@/lib/format"
import { resolveAddress, resolveTickerOnChain } from "@/lib/token"

export function AssetsSectionWithDepositButton({
  base,
  quote = "USDC",
  chainId,
}: {
  base: string
  quote?: string
  chainId?: ChainId
}) {
  const baseToken = resolveTickerOnChain(base, chainId)
  const quoteToken = resolveTickerOnChain(quote, chainId)
  const { data } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        !data.balances.find((balance) => balance.mint === baseToken?.address)
          ?.amount &&
        !data.balances.find((balance) => balance.mint === quoteToken?.address)
          ?.amount,
    },
  })
  return (
    <div className="flex">
      <div className="flex-1">
        <AssetsSection
          base={base}
          chainId={chainId}
          quote={quote}
        />
      </div>
      {data && (
        <TransferDialog mint={baseToken?.address}>
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
  chainId,
}: {
  base: string
  quote?: string
  disabled?: boolean
  chainId?: ChainId
}) {
  const baseToken = resolveTickerOnChain(base, chainId)
  const quoteToken = resolveTickerOnChain(quote, chainId)

  return (
    <>
      {baseToken ? (
        <Row mint={baseToken.address} />
      ) : (
        <RowFallback ticker={base} />
      )}
      {quoteToken ? (
        <Row mint={quoteToken.address} />
      ) : (
        <RowFallback ticker={quote} />
      )}
    </>
  )
}

function RowFallback({ ticker }: { ticker: string }) {
  return (
    <div className="flex justify-between">
      <div className="flex items-center space-x-2">
        <TokenIcon
          size={16}
          ticker={ticker}
        />
        <span className="text-muted-foreground opacity-50">{ticker}</span>
      </div>
      <span className="text-muted-foreground opacity-50">--</span>
    </div>
  )
}

function Row({
  mint,
  chainId,
  disabled,
}: {
  mint: `0x${string}`
  chainId?: ChainId
  disabled?: boolean
}) {
  const token = resolveAddress(mint)
  const { walletReadyState } = useWallets()

  const { data, status } = useBackOfQueueWallet({
    query: {
      select: (data) =>
        data.balances.find((balance) => balance.mint === token.address)?.amount,
    },
  })

  const isLoading = status === "pending"

  const balance = data ?? BigInt(0)
  const formattedBalance = isLoading
    ? "--"
    : formatNumber(balance, token.decimals, true)
  const usdPrice = useUSDPrice(token, balance)
  // balance is in token decimals, so adjust by token decimals
  const formattedUsdPrice = formatUnits(usdPrice, token.decimals)
  const formattedUsdPriceLabel = isLoading
    ? "--"
    : formatCurrencyFromString(formattedUsdPrice)

  return (
    <>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <TokenIcon
            size={16}
            ticker={token.ticker}
          />
          <TransferDialog mint={token.address}>
            <Button
              className="text-md h-fit p-0 text-muted-foreground"
              disabled={walletReadyState !== "READY"}
              variant="link"
              onClick={(e) => {
                if (walletReadyState !== "READY" || disabled) e.preventDefault()
              }}
            >
              {token.ticker}
            </Button>
          </TransferDialog>
        </div>
        <ResponsiveTooltip>
          <ResponsiveTooltipTrigger className="cursor-default">
            {formattedUsdPriceLabel}
          </ResponsiveTooltipTrigger>
          <ResponsiveTooltipContent side="right">
            {`${formattedBalance} ${token.ticker}`}
          </ResponsiveTooltipContent>
        </ResponsiveTooltip>
      </div>
    </>
  )
}
