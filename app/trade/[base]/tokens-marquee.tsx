import { DISPLAY_TOKENS } from '@/lib/token'
import Link from 'next/link'
import { Fragment } from 'react'

export function TokensMarquee() {
  const arr = Array.from({ length: 10 })
  return (
    <div className="group relative ml-8 flex min-h-marquee items-center overflow-hidden border-y font-extended text-sm">
      <div className="animate-marquee space-x-8 whitespace-nowrap group-hover:paused">
        {DISPLAY_TOKENS().map((token, index) => (
          <Fragment key={index}>
            <Link href={`/trade/${token.ticker}`}>
              <span className="space-x-6">
                <span>{token.ticker}</span>
                <span>$71,456.12</span>
              </span>
            </Link>
            <span className="text-xs">•</span>
          </Fragment>
        ))}
      </div>
      <div className="animate-marquee2 absolute ml-8 space-x-8 whitespace-nowrap group-hover:paused">
        {DISPLAY_TOKENS().map((token, index) => (
          <Fragment key={index}>
            <Link href={`/trade/${token.ticker}`}>
              <span className="space-x-6">
                <span>{token.ticker}</span>
                <span>$71,456.12</span>
              </span>
            </Link>
            <span className="text-xs">•</span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
