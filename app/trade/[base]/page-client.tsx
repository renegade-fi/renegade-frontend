"use client"

import React from "react"

import { useRouter } from "next/navigation"

import { isSupportedChainId } from "@renegade-fi/react"
import { useDebounceCallback } from "usehooks-ts"
import { useSwitchChain } from "wagmi"

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
import { useResolvePair } from "@/hooks/use-resolve-pair"
import { defaultInitState } from "@/providers/state-provider/server-store"
import { useServerStore } from "@/providers/state-provider/server-store-provider"

// Prevents re-render when side changes
const PriceChartMemo = React.memo(PriceChart)

export function PageClient({ base, chain }: { base: string; chain?: string }) {
  const { base: baseMint, quote: quoteMint } = useResolvePair(base)
  const router = useRouter()

  // Cache the base and quote mint in the server store
  const cachedBaseMint = useServerStore((s) => s.baseMint)
  const setBase = useServerStore((s) => s.setBase)
  const setQuote = useServerStore((s) => s.setQuote)
  React.useEffect(() => {
    if (cachedBaseMint !== baseMint) {
      setBase(baseMint)
      setQuote(quoteMint)
    }
  }, [baseMint, cachedBaseMint, quoteMint, setBase, setQuote])

  // If a chain is provided, cache it and switch to it
  // Removes the chain parameter from the URL after switching
  const setChainId = useServerStore((s) => s.setChainId)
  const { switchChain } = useSwitchChain()
  React.useEffect(() => {
    if (!chain) return
    const chainId = Number.parseInt(chain)
    if (!isSupportedChainId(chainId)) return
    setChainId(chainId)
    switchChain({ chainId })
    router.replace(`/trade/${base}`)
  }, [base, chain, router, setChainId, switchChain])

  const panels = useServerStore((s) => s.panels)
  const setPanels = useServerStore((s) => s.setPanels)
  const debouncedSetPanels = useDebounceCallback(setPanels, 500)

  const data = useOrderTableData()

  return (
    <>
      <MaintenanceBanner />
      <DepositBanner />
      <BBOMarquee base={baseMint} />
      <MobileAssetPriceAccordion base={baseMint} />
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
            <NewOrderPanel base={baseMint} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={panels.layout[1]}
            order={2}
          >
            <main>
              <PriceChartMemo baseTicker={base} />
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
      <MobileBottomBar base={baseMint} />
    </>
  )
}
