import Image from "next/image"

import { OrderMetadata, OrderState, Token } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

import { CancelButton } from "@/app/trade/[base]/components/order-details/cancel-button"
import { InsufficientWarning } from "@/app/trade/[base]/components/order-details/insufficient-warning"
import { OrderStatusIndicator } from "@/app/trade/[base]/components/order-details/order-status-indicator"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Side } from "@/lib/constants/protocol"
import { formatNumber, formatOrderState } from "@/lib/format"

export function EmptyContent({ order }: { order: OrderMetadata }) {
  const token = Token.findByAddress(order.data.base_mint)
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
  const isOpen =
    order.state !== OrderState.Filled && order.state !== OrderState.Cancelled

  return (
    <>
      <div className="flex p-6">
        <OrderStatusIndicator order={order} />
        {isOpen && (
          <InsufficientWarning
            amount={order.data.amount}
            baseMint={order.data.base_mint}
            className="text-sm font-bold"
            quoteMint={order.data.quote_mint}
            side={order.data.side === "Buy" ? Side.BUY : Side.SELL}
          />
        )}
        <div className="ml-auto flex">
          <CancelButton
            id={order.id}
            isDisabled={!isCancellable}
          />
        </div>
      </div>
      <Separator />
      <div className="flex h-24 items-center">
        <div className="flex-1 px-6">
          <div className="text-sm">{formatOrderState[order.state]}</div>
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
      </div>
      <Separator />
      <div className="grid h-[500px] place-items-center">
        <div className="flex flex-col items-center gap-10">
          <Image
            priority
            alt="logo"
            className="mx-auto animate-pulse"
            height="57"
            src="/glyph_dark.svg"
            width="46"
          />
          <div>
            Once your order is filled, you&apos;ll see the details here.
          </div>
          <Button
            asChild
            className="p-0 text-sm text-muted-foreground"
            variant="link"
          >
            <a
              href={`https://help.renegade.fi/hc/en-us/articles/32759851318931-Why-is-my-order-still-open`}
              rel="noreferrer"
              target="_blank"
            >
              Why is it taking so long to fill my order?
            </a>
          </Button>
        </div>
      </div>
    </>
  )
}
