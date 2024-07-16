import { Token } from '@renegade-fi/react'
import { formatUnits, parseUnits } from 'viem/utils'

import { usePrice } from '@/stores/price-store'

// Returns USD price of the given amount of the base token
export const useUSDPrice = (base: Token, amount: bigint) => {
  const price = usePrice({
    exchange: 'binance',
    baseAddress: base.address,
  })

  return price * parseFloat(formatUnits(amount, base.decimals))
}
