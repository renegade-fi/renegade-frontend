import { Exchange } from "@renegade-fi/react"
import { Token } from "@renegade-fi/token-nextjs"
import { QueryClient } from "@tanstack/react-query"

import { createPriceQueryKey } from "@/lib/query"
import { remapToken } from "@/lib/token"
import { getURL } from "@/lib/utils"

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
        const url = `${getURL()}/api/proxy/amberdata?path=/market/spot/prices/pairs/${ticker}_usdt/latest&exchange=binance`

        const res = await fetch(url)
        const data = await res.json()
        return data.payload.price
      }
    },
  })
}
