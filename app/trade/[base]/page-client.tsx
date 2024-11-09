"use client"

import React from "react"

import { DepositBanner } from "@/app/components/deposit-banner"
import { MaintenanceBanner } from "@/app/components/maintenance-banner"
import { MobileBottomBar } from "@/app/components/mobile-bottom-bar"
import { columns } from "@/app/orders/columns"
import { DataTable } from "@/app/orders/data-table"
import { BBOMarquee } from "@/app/trade/[base]/components/bbo-marquee"
import { PriceChart } from "@/app/trade/[base]/components/charts/price-chart"
import { FavoritesBanner } from "@/app/trade/[base]/components/favorites-banner"
import { MobileAssetPriceAccordion } from "@/app/trade/[base]/components/mobile-asset-price-accordion"
import { NewOrderPanel } from "@/app/trade/[base]/components/new-order/new-order-panel"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  React.useEffect(() => {
    const updateBase = async () => {
      await fetch("/api/cookie/set-base", {
        method: "POST",
        body: base.toUpperCase(),
      })
    }
    updateBase()
  }, [base])

  return (
    <>
      <MaintenanceBanner />
      <DepositBanner />
      <BBOMarquee base={base} />
      <MobileAssetPriceAccordion base={base} />
      <ScrollArea className="flex-grow">
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
          <ResizableHandle />
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
      </ScrollArea>
      <FavoritesBanner />
      <MobileBottomBar
        base={base}
        isUSDCDenominated={isUSDCDenominated}
      />
    </>
  )
}
