import React from "react"

import { ChevronRight } from "lucide-react"
import { formatUnits } from "viem"

import { OrderDetailsSheet } from "@/app/trade/[base]/components/order-details/order-details-sheet"

import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { formatCurrencyFromString, formatRelativeTimestamp } from "@/lib/format"
import { resolveAddress } from "@/lib/token"
import { cn, decimalNormalizePrice } from "@/lib/utils"

import { useRecentUnviewedFills } from "./hooks/use-unviewed-fills"
import { generateFillIdentifier } from "./hooks/use-viewed-fills"

export function RecentFillsMenuItem() {
  const { filteredOrders, totalUnviewedFills } = useRecentUnviewedFills()

  if (!totalUnviewedFills) {
    return null
  }

  return (
    <Collapsible
      asChild
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip="Recent Fills">
            Recent Fills
            <span className="ml-auto">{totalUnviewedFills}</span>
            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                {order.fills.map((fill) => {
                  const isBuy = order.data.side === "Buy"
                  const token = resolveAddress(order.data.base_mint)
                  const quoteToken = resolveAddress(order.data.quote_mint)
                  const fillId = generateFillIdentifier(
                    order.id,
                    fill.price.timestamp,
                  )

                  const value = amountTimesPrice(
                    fill.amount,
                    decimalNormalizePrice(
                      fill.price.price,
                      token.decimals,
                      quoteToken.decimals,
                    ),
                  )
                  const formattedValue = formatUnits(value, token.decimals)
                  const formattedUsdValue =
                    formatCurrencyFromString(formattedValue)

                  return (
                    <SidebarMenuSubItem key={fillId}>
                      <Tooltip>
                        <OrderDetailsSheet
                          key={fillId}
                          order={order}
                        >
                          <TooltipTrigger asChild>
                            <SidebarMenuSubButton className="flex cursor-pointer justify-between">
                              <div>
                                {`${formattedUsdValue} ${token?.ticker}`}
                              </div>
                              <Badge
                                className={cn(
                                  "pointer-events-none min-w-[50px] text-center",
                                  {
                                    "bg-[#1E2F2D] text-[#4DBE95]": isBuy,
                                    "bg-[#331E26] text-[#D84F68]": !isBuy,
                                  },
                                )}
                              >
                                {isBuy ? "BUY" : "SELL"}
                              </Badge>
                            </SidebarMenuSubButton>
                          </TooltipTrigger>
                        </OrderDetailsSheet>
                        <TooltipContent>
                          {formatRelativeTimestamp(
                            Number(fill.price.timestamp),
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuSubItem>
                  )
                })}
              </React.Fragment>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
