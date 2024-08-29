"use client"

import { InflowsOutflowsChart } from "@/app/stats/charts/inflows-outflows-chart"
import { TvlCumulativeDisplay } from "@/app/stats/charts/tvl-cumulative-display"
import { VolumeHistoricalChart } from "@/app/stats/charts/volume-historical-chart"

export function PageClient() {
  return (
    <main>
      <div className="container mt-12">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">TVL</h1>
            <div className="flex flex-grow flex-col items-center justify-center border px-6 py-5">
              <TvlCumulativeDisplay />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">Volume</h1>
            <VolumeHistoricalChart />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">
            Inflows / Outflows
          </h1>
          <InflowsOutflowsChart />
        </div>
      </div>
    </main>
  )
}
