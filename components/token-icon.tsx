import Image from "next/image"

import { cn } from "@/lib/utils"

export function TokenIcon({
  ticker,
  size = 32,
  className,
}: {
  className?: string
  ticker: string
  size?: number
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-full", className)}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        alt={ticker}
        height={size}
        src={`/tokens/${ticker.toLowerCase()}.png`}
        width={size}
      />
    </div>
  )
}
