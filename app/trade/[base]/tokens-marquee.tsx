import Link from 'next/link'

import { DISPLAY_TOKENS } from '@/lib/token'

import Marquee from '@/components/ui/marquee'

export function TokensMarquee() {
  return (
    <Marquee
      pauseOnHover
      className="[--duration:80s] font-extended text-sm fixed bottom-20 bg-background [--gap:32px] border-y"
    >
      {DISPLAY_TOKENS().map((token, index) => (
        <div className="flex items-center gap-8" key={index}>
          <Link href={`/trade/${token.ticker}`}>
            <span className="space-x-6">
              <span>{token.ticker}</span>
              <span>$71,456.12</span>
            </span>
          </Link>
          <span className="text-xs">•</span>
        </div>
      ))}
    </Marquee>
  )
}
