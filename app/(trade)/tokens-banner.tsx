import { Fragment } from 'react'

export function TokensBanner() {
  const arr = Array.from({ length: 10 })
  return (
    <div className="h-marquee flex items-center justify-between border-y border-input">
      {arr.map((_, index) => (
        <Fragment key={index}>
          <div className="space-x-2">
            <span>WBTC</span>
            <span>$71,456.12</span>
          </div>
          <span className="text-xs">•</span>
        </Fragment>
      ))}
    </div>
  )
}
