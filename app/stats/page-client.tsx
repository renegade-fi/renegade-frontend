"use client"

import { VolumeHistoricalChart } from "@/app/stats/charts/volume-historical-chart"

export function PageClient() {
  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="mb-4 mt-6 font-serif text-3xl font-bold">Volume</h1>
          <VolumeHistoricalChart />
        </div>
      </div>
    </main>
  )
}
