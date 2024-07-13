import { Fragment } from 'react'

import { Exchange } from '@renegade-fi/react'

import { AnimatedPrice } from '@/components/animated-price'

const exchanges: Exchange[] = ['binance', 'coinbase', 'kraken', 'okx']
const names: Record<Exchange, string> = {
  binance: 'Binance',
  coinbase: 'Coinbase',
  kraken: 'Kraken',
  okx: 'Okx',
}

export function BBOMarquee({ base }: { base: string }) {
  return (
    <div className="min-h-marquee whitespace-nowrap font-extended text-sm grid grid-cols-[auto_6px_1fr_6px_1fr_6px_1fr_6px_1fr] items-center border-y border-border">
      <span className="px-4">BBO Feeds</span>
      {exchanges.map(exchange => (
        <Fragment key={exchange}>
          <span className="text-xs">•</span>
          <div className="flex gap-4 justify-center">
            <span>{names[exchange]}</span>
            <AnimatedPrice exchange={exchange} base={base} />
            <span className="font-extended text-green-price">LIVE</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
