'use server'

import { Token } from '@renegade-fi/react'

import { DISPLAY_TOKENS } from '@/lib/token'

export async function getInitialPrices(): Promise<Map<string, number>> {
  const baseUrl = process.env.NEXT_PUBLIC_PRICE_REPORTER_URL
  const usdtAddress = Token.findByTicker('USDT').address

  const promises = DISPLAY_TOKENS({ hideStables: true }).map(token => {
    const topic = `binance-${token.address}-${usdtAddress}`
    return fetch(`https://${baseUrl}:3000/price/${topic}`)
      .then(res => res.text())
      .then(price => [topic, parseFloat(price)] as [string, number])
  })
  const results = await Promise.all(promises)
  return new Map(results)
}
