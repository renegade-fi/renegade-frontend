import Image from "next/image"

export function TokenIcon({
  ticker,
  size = 32,
}: {
  ticker: string
  size?: number
}) {
  return (
    <Image
      src={`/tokens/${ticker.toLowerCase()}.png`}
      alt={ticker}
      width={size}
      height={size}
    />
  )
}
