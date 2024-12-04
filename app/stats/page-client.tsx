"use client"

import { InflowsChart } from "@/app/stats/charts/inflows-chart"
import { TimeToFillCard } from "@/app/stats/charts/time-to-fill-card"
import { TvlChart } from "@/app/stats/charts/tvl-chart"
import { VolumeChart } from "@/app/stats/charts/volume-chart"

import { Button } from "@/components/ui/button"

export function PageClient() {
  return (
    <main className="container mb-8 mt-12 flex flex-col gap-12 px-4 lg:px-8">
      <div className="grid grid-cols-1 gap-4">
        <div className="col-span-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Time to Fill
          </h1>
          <div className="grid grid-cols-[3fr_1fr_1fr] gap-4">
            <TimeToFillCard />
            <div className="grid place-items-center border p-6">
              <div className="text-4xl">Zero</div>
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
                <div className="transition-colors hover:text-primary">
                  Price Impact
                </div>
                <div className="transition-colors hover:text-primary">
                  Copy Trading
                </div>
                <div className="transition-colors hover:text-primary">
                  Slippage
                </div>
                <div className="transition-colors hover:text-primary">MEV</div>
              </div>
            </div>
            <div className="grid place-items-center border p-6">
              <Button variant="ghost">Place Order</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 grid-rows-[1fr] gap-12 lg:grid-cols-3 lg:gap-4">
        <div className="col-span-1 flex flex-col">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Total Value Locked
          </h1>
          <TvlChart />
          {/* <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Time to Fill
          </h1>
          <TimeToFillCard /> */}
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
