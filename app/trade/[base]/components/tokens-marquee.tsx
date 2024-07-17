import Link from "next/link"

import { AnimatedPrice } from "@/components/animated-price"
import Marquee from "@/components/ui/marquee"

import { DISPLAY_TOKENS } from "@/lib/token"

export function TokensMarquee() {
  return (
    <Marquee
      pauseOnHover
      className="fixed bottom-20 border-y bg-background font-extended text-sm [--duration:80s] [--gap:32px]"
    >
      {DISPLAY_TOKENS({ hideStables: true, hideHidden: true }).map(
        (token, index) => (
          <div className="flex items-center gap-8" key={index}>
            <Link href={`/trade/${token.ticker}`}>
              <span className="space-x-4">
                <span>{token.ticker}</span>
                <AnimatedPrice base={token.ticker} />
              </span>
            </Link>
            <span className="text-xs">•</span>
          </div>
        ),
      )}
    </Marquee>
  )
}
