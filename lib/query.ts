import { Exchange, Token } from "@renegade-fi/react"

export async function getPriceFromPriceReporter(
  topic: string,
): Promise<number> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1000) // Abort after 1 second

  try {
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_PRICE_REPORTER_URL}:3000/price/${topic}`,
      {
        signal: controller.signal,
      },
    )
    clearTimeout(timeoutId)

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const text = await res.text()
    const price = parseFloat(text)
    if (isNaN(price)) throw new Error("Invalid price data")
    return price
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error(`Fetch aborted due to timeout for topic: ${topic}`)
      throw new Error(`Fetch request timed out for topic: ${topic}`)
    }
    console.error("Error fetching price:", error)
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const DEFAULT_QUOTE: Record<Exchange, `0x${string}`> = {
  binance: Token.findByTicker("USDT").address,
  coinbase: Token.findByTicker("USDC").address,
  kraken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  okx: Token.findByTicker("USDT").address,
}

export function createPriceTopic(
  exchange: Exchange = "binance",
  baseMint: `0x${string}`,
): string {
  return `${exchange}-${baseMint}-${DEFAULT_QUOTE[exchange]}`
}

export function createPriceQueryKey(
  exchange: Exchange = "binance",
  baseMint: `0x${string}`,
): string[] {
  return ["price", exchange, baseMint, DEFAULT_QUOTE[exchange]]
}

export function topicToQueryKey(topic: string): string[] {
  return ["price", ...topic.split("-")]
}

export function queryKeyToTopic(queryKey: string[]): string {
  const [, ...rest] = queryKey
  return rest.join("-")
}
