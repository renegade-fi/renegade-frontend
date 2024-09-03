import { createPriceQueryKey } from "@/lib/query"
import { remapToken } from "@/lib/token"
import { getURL } from "@/lib/utils"
import { Exchange, Token } from "@renegade-fi/react"
import { QueryClient } from "@tanstack/react-query"

export async function prefetchPrice(
  queryClient: QueryClient,
  baseMint: `0x${string}`,
  exchange: Exchange = "binance",
) {
  const queryKey = createPriceQueryKey(exchange, baseMint)
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => {
      const ticker = remapToken(Token.findByAddress(baseMint).ticker)
      if (exchange === "binance") {
        const res = await fetch(`${getURL()}/api/amberdata/price?asset=${ticker}`)
        const data = await res.json()
        return data.payload.price
      }
      // return getPriceFromPriceReporter(createPriceTopic(exchange, baseMint))
    },
  })
}
