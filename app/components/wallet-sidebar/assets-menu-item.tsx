import * as React from "react"

import Link from "next/link"

import { Token } from "@renegade-fi/token-nextjs"
import { ChevronRight, PieChart } from "lucide-react"

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

import { useAssetsTableData } from "@/hooks/use-assets-table-data"
import { formatCurrency, formatCurrencyFromString } from "@/lib/format"
import { DISPLAY_TOKENS } from "@/lib/token"

export function AssetsMenuItem() {
  const tokenData = useAssetsTableData({
    mints: DISPLAY_TOKENS().map((token) => token.address),
  })

  const totalRenegadeBalanceUsd = React.useMemo(() => {
    return tokenData.reduce((total, token) => {
      return total + Number(token.renegadeUsdValue)
    }, 0)
  }, [tokenData])

  return (
    <Collapsible
      asChild
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip="Assets">
            Assets
            <span className="ml-auto">
              {formatCurrency(totalRenegadeBalanceUsd)}
            </span>
            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {tokenData
              .filter((token) => token.renegadeBalance > 0)
              .sort((a, b) => {
                return Number(b.renegadeUsdValue) - Number(a.renegadeUsdValue)
              })
              .map((token) => {
                const tokenInfo = Token.findByAddress(token.mint)
                return (
                  <SidebarMenuSubItem key={token.mint}>
                    <SidebarMenuSubButton asChild>
                      <Link href={`/trade/${tokenInfo.ticker}`}>
                        <span>{tokenInfo.ticker}</span>
                        <span className="ml-auto">
                          {formatCurrencyFromString(token.renegadeUsdValue)}
                        </span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                asChild
                className="text-sidebar-foreground/70"
              >
                <Link href="/assets">
                  <span>Go to Assets</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
