import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { OrderState, Token, useOrderHistory } from '@renegade-fi/react'
import { AlertTriangle, Info } from 'lucide-react'
import invariant from 'tiny-invariant'

import { FillChart } from '@/app/trade/[base]/components/charts/fill-chart'
import { FillTable } from '@/app/trade/[base]/fill-table'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format'

export function OrderDetailsSheet({
  children,
  orderId,
}: {
  children: React.ReactNode
  orderId: string
}) {
  const { data } = useOrderHistory()
  const order = data?.get(orderId)
  invariant(order, 'Order not found')
  const token = Token.findByAddress(order.data.base_mint)

  const filledAmount = order.fills.reduce(
    (acc, fill) => acc + fill.amount,
    BigInt(0),
  )
  const formattedFilledAmount = formatNumber(filledAmount, token.decimals)
  const formattedTotalAmount = formatNumber(order.data.amount, token.decimals)
  const percentageFilled =
    (Number(filledAmount) / Number(order.data.amount)) * 100
  const percentageFilledLabel = formatPercentage(
    Number(filledAmount),
    Number(order.data.amount),
  )

  const title = `${order.data.side === 'Buy' ? 'Buy' : 'Sell'} ${formattedTotalAmount} ${token.ticker} ${
    order.data.side === 'Buy' ? 'with' : 'for'
  } USDC`

  const isCancellable = [OrderState.Created, OrderState.Matching].includes(
    order.state,
  )
  const isModifiable = [OrderState.Created, OrderState.Matching].includes(
    order.state,
  )

  const formattedFills = order.fills.map(fill => ({
    amount: Number(formatNumber(fill.amount, token.decimals)),
    price: Number(fill.price),
  }))
  const vwap =
    formattedFills.reduce((acc, fill) => acc + fill.amount * fill.price, 0) /
    formattedFills.reduce((acc, fill) => acc + fill.amount, 0)
  const filledLabel = `${formattedFilledAmount} ${token.ticker} @ ${formatCurrency(vwap)}`

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="p-0 sm:w-[576px] sm:max-w-[576px]">
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>View order details</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>
        <div className="">
          <div className="flex justify-between p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <div className="flex-1 border-0 text-sm font-bold">
                Insufficient USDC Balance
              </div>
            </div>
            <div className="flex">
              <Button
                variant="outline"
                className="flex-1"
                disabled={!isCancellable}
              >
                Cancel Order
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-l-0"
                disabled={!isModifiable}
              >
                Modify Order
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex h-24 items-center">
            <div className="flex-1 px-6">
              <div className="text-sm">Order</div>
              <div className="text-sm">{title}</div>
              <div className="text-sm">Midpoint Peg</div>
            </div>
            <Separator orientation="vertical" className="h-full" />
            <div className="flex-1 px-6">
              <div className="text-sm">Open</div>
              <div className="text-sm">{filledLabel}</div>
              <div className="flex items-center gap-2">
                <Progress value={percentageFilled} />
                <div className="text-sm">{percentageFilledLabel}</div>
              </div>
            </div>
          </div>
          <Separator />
          {order.fills.length ? (
            <FillChart baseMint={order.data.base_mint} fills={order.fills} />
          ) : (
            <Skeleton className="h-[500px] w-full" />
          )}
          <Separator />
          <FillTable orderId={orderId} />
          <Separator />
          <div className="flex cursor-pointer items-center gap-2 p-6 text-xs text-muted transition-colors hover:text-muted-foreground">
            <Info className="h-4 w-4" /> How are savings calculated?
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
