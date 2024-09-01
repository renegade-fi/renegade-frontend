import { Exchange, Token } from "@renegade-fi/react"
import { QueryClient } from "@tanstack/react-query"

import { fetchAssetPrice } from "@/app/api/amberdata/helpers"

import { createPriceQueryKey } from "@/lib/query"
import { remapToken } from "@/lib/token"

export async function prefetchPrice(
  queryClient: QueryClient,
  baseMint: `0x${string}`,
  exchange: Exchange = "binance",
) {
  const queryKey = createPriceQueryKey(exchange, baseMint)
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => {
      if (exchange === "binance") {
        return fetchAssetPrice(
          remapToken(Token.findByAddress(baseMint).ticker),
          process.env.NEXT_PUBLIC_AMBERDATA_API_KEY,
        ).then((res) => res.payload.price)
      }
      // return getPriceFromPriceReporter(createPriceTopic(exchange, baseMint))
    },
  })
}
