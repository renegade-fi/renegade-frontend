import React from "react"

import { Token } from "@renegade-fi/react"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronRight } from "lucide-react"
import { formatUnits } from "viem"

import { useViewedFills } from "@/app/components/wallet-sidebar/hooks/use-viewed-fills"
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

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { formatCurrencyFromString } from "@/lib/format"
import { createPriceQueryKey } from "@/lib/query"

import { useFilteredFills } from "./hooks/use-filtered-fills"
import { generateFillIdentifier } from "./hooks/use-viewed-fills"

export function RecentFillsMenuItem() {
  const { filteredOrders, totalUnviewedFills } = useFilteredFills()
  const { markFillAsViewed } = useViewedFills()
  const queryClient = useQueryClient()

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
                {order.fills.map((fill, index) => {
                  const isBuy = order.data.side === "Buy"
                  const token = Token.findByAddress(order.data.base_mint)
                  const fillId = generateFillIdentifier(
                    order.id,
                    fill.price.timestamp,
                  )

                  const priceKey = createPriceQueryKey(
                    "binance",
                    order.data.base_mint,
                  )
                  const price = queryClient.getQueryData<number>(priceKey) ?? 0

                  const usdValue = amountTimesPrice(fill.amount, price)
                  const formattedUsdValue = formatCurrencyFromString(
                    formatUnits(usdValue, token.decimals),
                  )

                  return (
                    <SidebarMenuSubItem key={fillId}>
                      <OrderDetailsSheet
                        key={fillId}
                        order={order}
                        onOpenChange={(isOpen) => {
                          if (!isOpen) {
                            markFillAsViewed(fillId)
                          }
                        }}
                      >
                        <SidebarMenuSubButton className="cursor-pointer">
                          {`${isBuy ? "Bought" : "Sold"} ${formattedUsdValue} of ${token?.ticker}`}
                        </SidebarMenuSubButton>
                      </OrderDetailsSheet>
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
