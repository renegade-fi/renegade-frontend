import { useCumulativeTvlUsd } from "@/app/stats/hooks/use-cumulative-tvl"

import { formatStat } from "@/lib/format"

export function TvlCumulativeDisplay() {
  const { cumulativeTvlUsd } = useCumulativeTvlUsd()
  const formattedCumTvlUsd = formatStat(cumulativeTvlUsd)

  return (
    <div className="font-serif text-4xl font-bold">{formattedCumTvlUsd}</div>
    //    <div className="font-extended">Cumulative TVL</div>
  )
}
