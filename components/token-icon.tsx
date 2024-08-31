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
      alt={ticker}
      className={cn(className)}
      height={size}
      src={`/tokens/${ticker.toLowerCase()}.png`}
      width={size}
    />
  )
}
