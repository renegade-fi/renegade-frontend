import Image from "next/image"

import { Token } from "@renegade-fi/token-nextjs"

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
  let logoUrl
  if (ticker === "SOL") {
    logoUrl = "/tokens/sol.png"
  } else {
    logoUrl = Token.findByTicker(ticker).logoUrl
  }

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
        src={logoUrl}
        width={size}
      />
    </div>
  )
}
