"use client"

import { VolumeHistorical } from "@/app/stats/charts/volume-historical-chart"
import { useVolume } from "@/app/stats/hooks/useVolume"

export function PageClient() {
  const { data, isLoading } = useVolume()
  return (
    <main>
      <div className="container">
        <div className="mt-12">
          <h1 className="mb-1 mt-6 font-serif text-3xl font-bold">Stats</h1>
          <VolumeHistorical initialData={data || []} />
        </div>
      </div>
    </main>
  )
}
