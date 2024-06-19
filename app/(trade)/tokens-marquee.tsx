import { Fragment } from 'react'

export function TokensMarquee() {
  const arr = Array.from({ length: 10 })
  return (
    <div className="h-marquee flex w-full items-center justify-evenly border-y border-input font-extended text-sm">
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
