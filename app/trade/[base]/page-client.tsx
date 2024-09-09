"use client"

import React from "react"

import { DepositBanner } from "@/app/components/deposit-banner"
import { MobileBottomBar } from "@/app/components/mobile-bottom-bar"
import { columns } from "@/app/orders/columns"
import { DataTable } from "@/app/orders/data-table"
import { BBOMarquee } from "@/app/trade/[base]/components/bbo-marquee"
import { PriceChart } from "@/app/trade/[base]/components/charts/price-chart"
import { MobileAssetPriceAccordion } from "@/app/trade/[base]/components/mobile-asset-price-accordion"
import { NewOrderPanel } from "@/app/trade/[base]/components/new-order/new-order-panel"

import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Separator } from "@/components/ui/separator"

import { useOrderTableData } from "@/hooks/use-order-table-data"
import { STORAGE_LAYOUT } from "@/lib/constants/storage"

const DEFAULT_LAYOUT = [22, 78]

// Prevents re-render when side changes
const PriceChartMemo = React.memo(PriceChart)

export function PageClient({
  defaultLayout = DEFAULT_LAYOUT,
  base,
  isUSDCDenominated,
}: {
  defaultLayout?: number[]
  base: string
  isUSDCDenominated?: boolean
}) {
  const data = useOrderTableData()

  return (
    <div>
      <DepositBanner />
      <BBOMarquee base={base} />
      <MobileAssetPriceAccordion base={base} />
      <ResizablePanelGroup
        autoSaveId={STORAGE_LAYOUT}
        direction="horizontal"
      >
        <ResizablePanel
          className="hidden lg:block"
          defaultSize={defaultLayout[0]}
          maxSize={50}
          minSize={DEFAULT_LAYOUT[0]}
          order={1}
        >
          <NewOrderPanel
            base={base}
            isUSDCDenominated={isUSDCDenominated}
          />
        </ResizablePanel>
        {/* <ResizableHandle /> */}

        <Separator
          className="hidden lg:block"
          orientation="vertical"
        />
        <ResizablePanel
          defaultSize={defaultLayout[1]}
          order={2}
        >
          <main>
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
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
      <MobileBottomBar
        base={base}
        isUSDCDenominated={isUSDCDenominated}
      />
    </div>
  )
}
