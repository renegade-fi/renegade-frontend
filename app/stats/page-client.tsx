"use client"

import { useState } from "react"

import { Info } from "lucide-react"

import { ChainSelector } from "@/app/stats/chain-selector"
import { InflowsChart } from "@/app/stats/charts/inflows-chart"
import { VolumeChart } from "@/app/stats/charts/volume-chart"

import { Button } from "@/components/ui/button"

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles"

import { TimeToFillCard } from "./charts/time-to-fill-card"
import { TvlSection } from "./charts/tvl/tvl-section"

export function PageClient() {
  const [selectedChainId, setSelectedChainId] = useState<number>(0)
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
            <TimeToFillCard chainId={selectedChainId} />
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

      <div className="grid grid-cols-1 grid-rows-[1fr] gap-12 lg:gap-4">
        <div className="col-span-1 flex flex-col">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Total Value Deposited
          </h1>
          <TvlSection chainId={selectedChainId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Volume
          </h1>
          <VolumeChart chainId={selectedChainId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Inflows
          </h1>
          <InflowsChart chainId={selectedChainId} />
        </div>
      </div>
    </main>
  )
}
