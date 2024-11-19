import React from "react"

import { Token } from "@renegade-fi/react"
import { ChevronRight } from "lucide-react"
import { formatUnits } from "viem"

import { OrderDetailsSheet } from "@/app/trade/[base]/components/order-details/order-details-sheet"

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
import { decimalNormalizePrice } from "@/lib/utils"

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
                  const token = Token.findByAddress(order.data.base_mint)
                  const quoteToken = Token.findByAddress(order.data.quote_mint)
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
                            <SidebarMenuSubButton className="cursor-pointer">
                              {`${isBuy ? "Bought" : "Sold"} ${formattedUsdValue} of ${token?.ticker}`}
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
