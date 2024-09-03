"use client"

import React from "react"

import { DepositBanner } from "@/app/components/deposit-banner"
import { columns } from "@/app/orders/columns"
import { DataTable } from "@/app/orders/data-table"
import { BBOMarquee } from "@/app/trade/[base]/components/bbo-marquee"
import { PriceChart } from "@/app/trade/[base]/components/charts/price-chart"
import { NewOrderPanel } from "@/app/trade/[base]/components/new-order/new-order-panel"

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"

import { useMediaQuery } from "@/hooks/use-media-query"
import { useMounted } from "@/hooks/use-mounted"
import { useOrderTableData } from "@/hooks/use-order-table-data"
import { Side } from "@/lib/constants/protocol"
import { STORAGE_LAYOUT } from "@/lib/constants/storage"

import { setSide } from "./actions"

const DEFAULT_LAYOUT = [22, 78]
const DEFAULT_SIDE = Math.random() < 0.5 ? Side.BUY : Side.SELL

// Prevents re-render when side changes
const PriceChartMemo = React.memo(PriceChart)

export function PageClient({
  defaultLayout = DEFAULT_LAYOUT,
  side,
  base,
  isUSDCDenominated,
}: {
  defaultLayout?: number[]
  side?: Side
  base: string
  isUSDCDenominated?: boolean
}) {
  // const onLayout = (sizes: number[]) => {
  //   document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}; path=/; SameSite=Strict; Secure`
  // }
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isMounted = useMounted()

  const data = useOrderTableData()

  React.useEffect(() => {
    if (!side) {
      const randomSide = Math.random() < 0.5 ? Side.BUY : Side.SELL
      setSide(randomSide)
    }
  }, [side])

  return (
    <div>
      <DepositBanner />
      <BBOMarquee base={base} />
      <ResizablePanelGroup
        autoSaveId={STORAGE_LAYOUT}
        direction="horizontal"
        // onLayout={onLayout}
      >
        {(!isMounted || (isMounted && isDesktop)) && (
          <>
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              maxSize={50}
              minSize={DEFAULT_LAYOUT[0]}
              order={1}
            >
              <NewOrderPanel
                base={base}
                isUSDCDenominated={isUSDCDenominated}
                side={side ?? DEFAULT_SIDE}
              />
            </ResizablePanel>
            {/* <ResizableHandle /> */}
          </>
        )}
        <Separator orientation="vertical" />
        <ResizablePanel
          defaultSize={defaultLayout[1]}
          order={2}
        >
          <main>
            <div className="overflow-auto">
              <PriceChartMemo base={base} />
              <Separator />
              <div className="p-6">
                <DataTable
                  isTradePage
                  columns={columns}
                  data={data}
                  initialStatus="open"
                  initialVisibleColumns={{
                    "time to fill": false,
                    actions: false,
                    saved: false,
                  }}
                />
              </div>
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
