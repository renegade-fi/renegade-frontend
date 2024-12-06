"use client"

import React from "react"

import { useDebounceCallback } from "usehooks-ts"

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
import { defaultInitState } from "@/providers/state-provider/server-store"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

// Prevents re-render when side changes
const PriceChartMemo = React.memo(PriceChart)

export function PageClient({ base }: { base: string }) {
  const data = useOrderTableData()
  const { setBase, panels, setPanels } = useServerStore((state) => state)
  const debouncedSetPanels = useDebounceCallback(setPanels, 500)

  React.useEffect(() => {
    setBase(base)
  }, [base, setBase])

  return (
    <>
      <MaintenanceBanner />
      <DepositBanner />
      <BBOMarquee base={base} />
      <MobileAssetPriceAccordion base={base} />
      <ScrollArea className="flex-grow">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(layout) => debouncedSetPanels(layout)}
        >
          <ResizablePanel
            className="hidden lg:block"
            defaultSize={panels.layout[0]}
            maxSize={50}
            minSize={defaultInitState.panels.layout[0]}
            order={1}
          >
            <NewOrderPanel base={base} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={panels.layout[1]}
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
      <MobileBottomBar base={base} />
    </>
  )
}
