import { Token } from "@renegade-fi/react"

import { DISPLAY_TOKENS, remapToken } from "@/lib/token"

// Fetch initial prices using Price Reporter
// export async function getInitialPrices(): Promise<Map<string, number>> {
//   const baseUrl = process.env.NEXT_PUBLIC_PRICE_REPORTER_URL
//   const usdtAddress = Token.findByTicker("USDT").address

//   const promises = DISPLAY_TOKENS({ hideStables: true }).map(token => {
//     const topic = `binance-${token.address}-${usdtAddress}`
//     return fetch(`https://${baseUrl}:3000/price/${topic}`)
//       .then(res => res.text())
//       .then(price => [topic, parseFloat(price)] as [string, number])
//   })
//   const results = await Promise.all(promises)
//   return new Map(results)
// }

// Fetch initial prices using Amberdata
export async function getInitialPrices(): Promise<Map<string, number>> {
  const baseUrl = `https://api.amberdata.com/market/spot/prices/pairs`
  const usdtAddress = Token.findByTicker("USDT").address

  const promises = DISPLAY_TOKENS({ hideStables: true }).map((token) => {
    const topic = `binance-${token.address}-${usdtAddress}`
    return fetch(
      `${baseUrl}/${remapToken(token.ticker)}_usdt/latest?exchange=binance`,
      {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_AMBERDATA_API_KEY,
        },
        cache: "force-cache",
      },
    )
      .then((res) => res.json())
      .then(
        (data) => [topic, parseFloat(data.payload.price)] as [string, number],
      )
  })
  const results = await Promise.all(promises)
  return new Map(results)
}
