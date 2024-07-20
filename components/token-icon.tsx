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
    <Image
      className={cn(className)}
      src={`/tokens/${ticker.toLowerCase()}.png`}
      alt={ticker}
      width={size}
      height={size}
    />
  )
}
