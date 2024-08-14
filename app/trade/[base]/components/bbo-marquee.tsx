import { Fragment } from "react"

import { Exchange, Token } from "@renegade-fi/react"

import { AnimatedPrice } from "@/components/animated-price"

const exchanges: Exchange[] = ["binance", "coinbase", "kraken", "okx"]
const names: Record<Exchange, string> = {
  binance: "Binance",
  coinbase: "Coinbase",
  kraken: "Kraken",
  okx: "Okx",
}

export function BBOMarquee({ base }: { base: string }) {
  return (
    <div className="grid min-h-marquee grid-cols-[auto_6px_1fr_6px_1fr_6px_1fr_6px_1fr] items-center whitespace-nowrap border-b border-border font-extended text-sm">
      <span className="px-4">BBO Feeds</span>
      {exchanges.map(exchange => (
        <Fragment key={exchange}>
          <span className="text-xs">•</span>
          <div className="flex justify-center gap-4">
            <span>{names[exchange]}</span>
            <AnimatedPrice
              exchange={exchange}
              mint={Token.findByTicker(base).address}
            />
            <span className="font-extended text-green-price">LIVE</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
