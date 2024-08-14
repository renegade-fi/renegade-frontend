import { Fragment } from "react"

import { Exchange, Token } from "@renegade-fi/react"

import { AnimatedPrice } from "@/components/animated-price"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { BBO_TOOLTIP } from "@/lib/constants/tooltips"
import { remapToken } from "@/lib/token"

const exchanges: Exchange[] = ["binance", "coinbase", "kraken", "okx"]
const names: Record<Exchange, string> = {
  binance: "Binance",
  coinbase: "Coinbase",
  kraken: "Kraken",
  okx: "OKX",
}

export function BBOMarquee({ base }: { base: string }) {
  return (
    <div className="grid min-h-marquee grid-cols-[0.5fr_6px_1fr_6px_1fr_6px_1fr_6px_1fr] items-center whitespace-nowrap border-b border-border font-extended text-sm">
      <Tooltip>
        <TooltipTrigger>
          <span className="flex justify-center">BBO Feeds</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-sans">{BBO_TOOLTIP}</p>
        </TooltipContent>
      </Tooltip>
      {exchanges.map(exchange => (
        <Fragment key={exchange}>
          <span className="text-xs">•</span>
          <a href={constructExchangeUrl(exchange, base)} target="_blank">
            <div className="flex justify-center gap-4">
              <span>{names[exchange]}</span>
              <AnimatedPrice
                exchange={exchange}
                mint={Token.findByTicker(base).address}
              />
              <span className="font-extended text-green-price">LIVE</span>
            </div>
          </a>
        </Fragment>
      ))}
    </div>
  )
}

function remapQuote(exchange: Exchange) {
  switch (exchange) {
    case "binance":
    case "okx":
      return "USDT"
    case "coinbase":
    case "kraken":
      return "USD"
  }
}

function constructExchangeUrl(exchange: Exchange, base: string) {
  const remappedBase = remapToken(base)
  const quote = remapQuote(exchange)
  switch (exchange) {
    case "binance":
      return `https://www.binance.com/en/trade/${remappedBase}_${quote}`
    case "coinbase":
      return `https://www.coinbase.com/advanced-trade/${remappedBase}-${quote}`
    case "kraken":
      return `https://pro.kraken.com/app/trade/${remappedBase}-${quote}`
    case "okx":
      return `https://www.okx.com/trade-spot/${remappedBase}-${quote}`
    default:
      return ""
  }
}
