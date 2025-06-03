"use client"

import { useState } from "react"

import { Info } from "lucide-react"
import { useChainId } from "wagmi"

import { ChainSelector } from "@/app/stats/chain-selector"
import { InflowsChart } from "@/app/stats/charts/inflows-chart"
import { TimeToFillCard } from "@/app/stats/charts/time-to-fill-card"
import { TvlChart } from "@/app/stats/charts/tvl-chart"
import { VolumeChart } from "@/app/stats/charts/volume-chart"

import { Button } from "@/components/ui/button"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"
import { AVAILABLE_CHAINS } from "@/providers/wagmi-provider/config"

export function PageClient() {
  const currentChainId = useChainId()
  const defaultChainId =
    currentChainId &&
    AVAILABLE_CHAINS.some((chain) => chain.id === currentChainId)
      ? currentChainId
      : AVAILABLE_CHAINS[0].id
  const [selectedChainId, setSelectedChainId] = useState<number>(defaultChainId)

  return (
    <main className="container mb-8 mt-12 flex flex-col gap-12 px-4 lg:px-8">
      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <div className="mb-4 mt-6 flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
              Time to Fill
            </h1>
            <ChainSelector
              chainId={selectedChainId}
              onChange={setSelectedChainId}
            />
          </div>
          <div className="relative border py-16">
            <TimeToFillCard />
            <div className="absolute bottom-2 right-4">
              <Button
                asChild
                className="p-0 text-xs text-muted-foreground"
                variant="link"
              >
                <a
                  href={HELP_CENTER_ARTICLES.ORDER_FILLING.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Info className="mr-1 h-3 w-3" />
                  Why the wait?
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 grid-rows-[1fr] gap-12 lg:grid-cols-3 lg:gap-4">
        <div className="col-span-1 flex flex-col">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Total Value Locked
          </h1>
          <TvlChart chainId={selectedChainId} />
        </div>
        <div className="col-span-1 lg:col-span-2">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Volume
          </h1>
          <VolumeChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Inflows
          </h1>
          <InflowsChart />
        </div>
      </div>
    </main>
  )
}
