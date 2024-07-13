import * as React from 'react'

import { Exchange, Token } from '@renegade-fi/react'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePrice } from '@/stores/price-store'

export function AnimatedPrice({
  exchange = 'binance',
  base,
}: {
  exchange: Exchange
  base: string
}) {
  const price = usePrice({
    exchange,
    baseAddress: Token.findByTicker(base).address,
  })
  const prev = React.useRef(price)
  const [animationKey, setAnimationKey] = React.useState(0)

  React.useEffect(() => {
    if (price !== prev.current) {
      // Use requestAnimationFrame to batch DOM updates
      requestAnimationFrame(() => {
        setAnimationKey(prevKey => prevKey + 1)
        requestAnimationFrame(() => {
          prev.current = price // Update ref after the browser has painted
        })
      })
    }
  }, [price])

  return (
    <span
      key={animationKey}
      className={cn({
        'animate-price-green': price > prev.current,
        'animate-price-red': price < prev.current,
      })}
    >
      {formatCurrency(price)}
    </span>
  )
}
