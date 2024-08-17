import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { OrderMetadata, OrderState, Token } from "@renegade-fi/react"
import { Info } from "lucide-react"
import { formatUnits } from "viem/utils"

import { FillChart } from "@/app/trade/[base]/components/charts/fill-chart"
import { FillChartSkeleton } from "@/app/trade/[base]/components/charts/fill-chart-skeleton"
import { CancelButton } from "@/app/trade/[base]/components/order-details/cancel-button"
import {
  FillTableData,
  columns,
} from "@/app/trade/[base]/components/order-details/columns"
import { DataTable } from "@/app/trade/[base]/components/order-details/data-table"
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning"
import { OrderStatusIndicator } from "@/app/trade/[base]/components/order-details/order-status-indicator"

import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { Side } from "@/lib/constants/protocol"
import {
  formatCurrency,
  formatCurrencyFromString,
  formatNumber,
  formatOrderState,
  formatPercentage,
} from "@/lib/format"

export function OrderDetailsSheet({
  children,
  order,
}: {
  children: React.ReactNode
  order: OrderMetadata
}) {
  const token = Token.findByAddress(order.data.base_mint)

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

  const formattedFills = order.fills.map((fill) => ({
    amount: Number(formatNumber(fill.amount, token.decimals)),
    price: Number(fill.price.price),
  }))
  const vwap =
    formattedFills.reduce((acc, fill) => acc + fill.amount * fill.price, 0) /
    formattedFills.reduce((acc, fill) => acc + fill.amount, 0)

  // TODO: Calculate in bigint units
  const formattedVWAP = vwap ? formatCurrency(vwap) : "--"
  const filledLabel = `${formattedFilledAmount} ${token.ticker} @ ${formattedVWAP}`
  const filledLabelLong = `${formattedFilledAmountLong} ${token.ticker} @ ${formattedVWAP}`

  const data: FillTableData[] = order.fills.map((fill, index) => {
    const amount = formatNumber(fill.amount, token.decimals)
    const amountLong = formatUnits(fill.amount, token.decimals)
    const value = amountTimesPrice(fill.amount, fill.price.price)
    const formattedValue = formatUnits(value, token.decimals)
    const formattedValueUSD = formatCurrencyFromString(formattedValue)
    return {
      index,
      amount,
      amountLong,
      amountUSD: formattedValueUSD,
      timestamp: Number(fill.price.timestamp),
      createdAt: Number(order.created),
    }
  })
  const isOpen =
    order.state !== OrderState.Filled && order.state !== OrderState.Cancelled

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="p-0 sm:w-[576px] sm:max-w-[576px]"
        hideCloseButton
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>View order details</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <ScrollArea className="h-full">
          <div className="flex p-6">
            <OrderStatusIndicator order={order} />
            {isOpen && (
              <InsufficientWarning
                className="text-sm font-bold"
                amount={order.data.amount}
                baseMint={order.data.base_mint}
                quoteMint={order.data.quote_mint}
                side={order.data.side === "Buy" ? Side.BUY : Side.SELL}
              />
            )}
            <div className="ml-auto flex">
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
          <div className="flex h-24 items-center">
            <div className="flex-1 px-6">
              <div className="text-sm">Order</div>

              <Tooltip>
                <TooltipTrigger>
                  <div className="text-sm">{title}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-sans">{titleLong}</p>
                </TooltipContent>
              </Tooltip>
              <div className="text-sm">Midpoint Peg</div>
            </div>
            <Separator
              orientation="vertical"
              className="h-full"
            />
            <div className="flex-1 px-6">
              <div className="text-sm">{formatOrderState(order.state)}</div>
              <Tooltip>
                <TooltipTrigger>
                  <span className="flex justify-center">{filledLabel}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-sans">{filledLabelLong}</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex items-center gap-2">
                <Progress value={percentageFilled} />
                <div className="text-sm">{percentageFilledLabel}</div>
              </div>
            </div>
          </div>
          <Separator />
          {order.fills.length ? (
            <FillChart order={order} />
          ) : (
            <>
              {order.state === OrderState.Cancelled ? null : (
                <FillChartSkeleton />
              )}
            </>
          )}
          <Separator />
          <div className="space-y-4 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Fills</h3>
            <DataTable
              columns={columns}
              data={data}
              isCancelled={order.state === OrderState.Cancelled}
            />
            <div className="flex cursor-pointer items-center gap-2 text-xs text-muted transition-colors hover:text-muted-foreground">
              <Info className="h-4 w-4" /> How are savings calculated?
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
