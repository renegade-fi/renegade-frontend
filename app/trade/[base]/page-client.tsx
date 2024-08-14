"use client"

import React from "react"

import { Token, useOrderHistory } from "@renegade-fi/react"

import { DepositBanner } from "@/app/components/deposit-banner"
import { columns } from "@/app/orders/columns"
import { DataTable } from "@/app/orders/data-table"
import { BBOMarquee } from "@/app/trade/[base]/components/bbo-marquee"
import { PriceChart } from "@/app/trade/[base]/components/charts/price-chart"
import { NewOrderPanel } from "@/app/trade/[base]/components/new-order/new-order-panel"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"

import { useMediaQuery } from "@/hooks/use-media-query"
import { useMounted } from "@/hooks/use-mounted"
import { Side } from "@/lib/constants/protocol"
import { STORAGE_LAYOUT } from "@/lib/constants/storage"

const DEFAULT_LAYOUT = [22, 78]
const DEFAULT_SIDE = Math.random() < 0.5 ? Side.BUY : Side.SELL

// Prevents re-render when side changes
const PriceChartMemo = React.memo(PriceChart)

export function PageClient({
  defaultLayout = DEFAULT_LAYOUT,
  side = DEFAULT_SIDE,
  base,
  isUSDCDenominated,
}: {
  defaultLayout?: number[]
  side?: Side
  base: string
  isUSDCDenominated?: boolean
}) {
  const onLayout = (sizes: number[]) => {
    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
  }
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isMounted = useMounted()

  const { data } = useOrderHistory({
    query: {
      select: data => Array.from(data?.values() || []),
    },
  })

  return (
    <div>
      <DepositBanner />
      <BBOMarquee base={base} />
      <ResizablePanelGroup
        autoSaveId={STORAGE_LAYOUT}
        direction="horizontal"
        onLayout={onLayout}
      >
        {(!isMounted || (isMounted && isDesktop)) && (
          <>
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              minSize={DEFAULT_LAYOUT[0]}
              maxSize={50}
              order={1}
            >
              <NewOrderPanel
                base={base}
                side={side}
                isUSDCDenominated={isUSDCDenominated}
              />
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}
        <ResizablePanel defaultSize={defaultLayout[1]} order={2}>
          <main>
            <div className="overflow-auto">
              <PriceChartMemo base={base} />
              <Separator />
              <div className="p-6">
                <DataTable
                  columns={columns}
                  data={data || []}
                  initialStatus="open"
                  initialVisibleColumns={{
                    "time to fill": false,
                    actions: false,
                    saved: false,
                  }}
                  isTradePage
                />
              </div>
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
