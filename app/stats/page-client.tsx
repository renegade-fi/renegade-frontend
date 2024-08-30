"use client"

import { InflowsChart } from "@/app/stats/charts/inflows-chart"
import { TvlChart } from "@/app/stats/charts/tvl-chart"
import { VolumeChart } from "@/app/stats/charts/volume-chart"

export function PageClient() {
  return (
    <main>
      <div className="container mb-8 mt-12 space-y-12">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">
              Total Value Locked
            </h1>
            <TvlChart />
          </div>
          <div className="col-span-2">
            <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">Volume</h1>
            <VolumeChart />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1">
            <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">Inflows</h1>
            <InflowsChart />
          </div>
        </div>
      </div>
    </main>
  )
}
