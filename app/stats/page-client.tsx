"use client"

import { InflowsChart } from "@/app/stats/charts/inflows-chart"
import { TvlChart } from "@/app/stats/charts/tvl-chart"
import { VolumeChart } from "@/app/stats/charts/volume-chart"

export function PageClient() {
  return (
    <main className="container mb-8 mt-12 space-y-12 px-4 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-4">
        <div className="col-span-1">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold tracking-tighter lg:tracking-normal">
            Total Value Locked
          </h1>
          <TvlChart />
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
