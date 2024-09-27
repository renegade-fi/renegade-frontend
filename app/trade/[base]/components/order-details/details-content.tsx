import { OrderMetadata, OrderState, Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { FillChart } from "@/app/trade/[base]/components/charts/fill-chart"
import { CancelButton } from "@/app/trade/[base]/components/order-details/cancel-button"
import {
  FillTableData,
  columns,
} from "@/app/trade/[base]/components/order-details/columns"
import { DataTable } from "@/app/trade/[base]/components/order-details/data-table"
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning"
import { OrderStatusIndicator } from "@/app/trade/[base]/components/order-details/order-status-indicator"

import { Progress } from "@/components/ui/progress"
import {
  ResponsiveTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"
import {
  formatCurrency,
  formatCurrencyFromString,
  formatNumber,
  formatOrderState,
  formatPercentage,
} from "@/lib/format"
import { getVWAP } from "@/lib/order"
import { decimalNormalizePrice } from "@/lib/utils"

export function DetailsContent({ order }: { order: OrderMetadata }) {
  const token = Token.findByAddress(order.data.base_mint)
  const quoteToken = Token.findByAddress(order.data.quote_mint)
  const filledAmount = order.fills.reduce(
    (acc, fill) => acc + fill.amount,
    BigInt(0),
  )
  const formattedFilledAmount = formatNumber(filledAmount, token.decimals)
  const formattedFilledAmountLong = formatUnits(filledAmount, token.decimals)
  const percentageFilled =
    (Number(filledAmount) / Number(order.data.amount)) * 100
  const percentageFilledLabel = formatPercentage(
    Number(filledAmount),
    Number(order.data.amount),
  )
  const remainingAmount = order.data.amount - filledAmount
  const formattedMinFillAmount = formatNumber(
    order.data.min_fill_amount || BigInt(0),
    token.decimals,
  )

  const formattedTotalAmount = formatNumber(
    order.data.amount,
    token.decimals,
    true,
  )
  const formattedTotalAmountLong = formatUnits(
    order.data.amount,
    token.decimals,
  )
  const title = `${order.data.side === "Buy" ? "Buy" : "Sell"} ${formattedTotalAmount} ${token.ticker} ${
    order.data.side === "Buy" ? "with" : "for"
  } USDC`
  const titleLong = `${order.data.side === "Buy" ? "Buy" : "Sell"} ${formattedTotalAmountLong} ${token.ticker} ${
    order.data.side === "Buy" ? "with" : "for"
  } USDC`

  const isCancellable = [OrderState.Created, OrderState.Matching].includes(
    order.state,
  )
  const isModifiable = [OrderState.Created, OrderState.Matching].includes(
    order.state,
  )
  const vwap = getVWAP(order)
  const formattedVWAP = vwap ? formatCurrency(vwap) : "--"
  const filledLabel = `${formattedFilledAmount} ${token.ticker} @ ${formattedVWAP}`
  const filledLabelLong = `${formattedFilledAmountLong} ${token.ticker} @ ${formattedVWAP}`

  const data: FillTableData[] = order.fills.map((fill, index) => {
    const amount = formatNumber(fill.amount, token.decimals)
    const amountLong = formatNumber(fill.amount, token.decimals, true)
    const value = amountTimesPrice(
      fill.amount,
      decimalNormalizePrice(
        fill.price.price,
        token.decimals,
        quoteToken.decimals,
      ),
    )
    const formattedValue = formatUnits(value, token.decimals)
    const formattedValueUSD = formatCurrencyFromString(formattedValue)
    return {
      index,
      amount,
      amountLong,
      amountUSD: formattedValueUSD,
      timestamp: Number(fill.price.timestamp),
      createdAt: Number(order.created),
      ticker: token.ticker,
    }
  })
  const isOpen =
    order.state !== OrderState.Filled && order.state !== OrderState.Cancelled

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-6 lg:flex-row">
        <OrderStatusIndicator order={order} />
        {isOpen && (
          <InsufficientWarning
            withDialog
            amount={remainingAmount}
            baseMint={order.data.base_mint}
            className="text-sm font-bold tracking-tighter lg:tracking-normal"
            quoteMint={order.data.quote_mint}
            side={order.data.side === "Buy" ? Side.BUY : Side.SELL}
          />
        )}
        <div className="hidden lg:ml-auto lg:flex">
          <CancelButton
            id={order.id}
            isDisabled={!isCancellable}
          />
          {/* <Button
                variant="outline"
                className="flex-1 border-l-0"
                disabled={!isModifiable}
              >
                Modify Order
              </Button> */}
        </div>
      </div>
      <Separator />
      <div className="flex flex-col items-center lg:flex-row lg:text-sm">
        <div className="w-full flex-1 px-6 py-4 lg:w-auto lg:border-r">
          <div>{formatOrderState[order.state]}</div>
          <ResponsiveTooltip>
            <ResponsiveTooltipTrigger>
              <div>{title}</div>
            </ResponsiveTooltipTrigger>
            <ResponsiveTooltipContent>
              <p className="font-sans">{titleLong}</p>
            </ResponsiveTooltipContent>
          </ResponsiveTooltip>
          <div>Midpoint Peg</div>
        </div>
        <Separator className="lg:hidden" />
        <div className="w-full flex-1 px-6 py-4 lg:w-auto">
          <div>Filled</div>
          <ResponsiveTooltip>
            <ResponsiveTooltipTrigger>
              <span className="flex justify-center">{filledLabel}</span>
            </ResponsiveTooltipTrigger>
            <ResponsiveTooltipContent>
              <p className="font-sans">{filledLabelLong}</p>
            </ResponsiveTooltipContent>
          </ResponsiveTooltip>
          <div className="flex items-center gap-2">
            <Progress value={percentageFilled} />
            <div>{percentageFilledLabel}</div>
          </div>
          <div>
            Min fill amount: {formattedMinFillAmount} {token.ticker}
          </div>
        </div>
      </div>
      <Separator />
      <FillChart order={order} />
      <Separator />
      <div className="p-6 lg:hidden">
        <CancelButton
          className="border-destructive"
          id={order.id}
          isDisabled={!isCancellable}
        />
      </div>
      <Separator className="lg:hidden" />
      <div className="space-y-4 p-6">
        <h3 className="font-semibold leading-none tracking-tight">Fills</h3>
        <DataTable
          columns={columns}
          data={data}
          isCancelled={order.state === OrderState.Cancelled}
        />
        {/* <div className="flex cursor-pointer items-center gap-2 text-xs text-muted transition-colors hover:text-muted-foreground">
              <Info className="h-4 w-4" /> How are savings calculated?
            </div> */}
      </div>
    </ScrollArea>
  )
}
