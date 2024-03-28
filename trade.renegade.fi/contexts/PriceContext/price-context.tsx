import { Exchange, PriceReporterWs, Token } from "@renegade-fi/renegade-js"
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

const PriceContext = createContext<{
  priceReporter: PriceReporterWs | null
  handleSubscribe: (
    exchange: Exchange,
    base: string,
    quote: string,
    decimals: number
  ) => void
  handleGetPrice: (
    exchange: Exchange,
    base: string,
    quote: string
  ) => number | undefined
} | null>(null)

const UPDATE_THRESHOLD_MS = 1000

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  const [priceReporter, setPriceReporter] = useState<PriceReporterWs | null>(
    null
  )
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [attempted, setAttempted] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const priceReporter = new PriceReporterWs()
    setPriceReporter(priceReporter)
    return () => {
      priceReporter.teardown()
    }
  }, [])

  const handleSubscribe = useCallback(
    (exchange: Exchange, base: string, quote: string, decimals: number) => {
      if (!priceReporter) return

      const topic = getTopic(exchange, base, quote)
      if (attempted[topic]) return

      let lastUpdate = 0
      const now = Date.now()
      if (now - lastUpdate <= UPDATE_THRESHOLD_MS) {
        return
      }
      lastUpdate = now

      priceReporter.subscribeToTokenPair(
        exchange,
        new Token({ ticker: base }),
        new Token({ ticker: quote }),
        (price) => {
          setPrices((prevPrices) => {
            if (
              prevPrices[topic]?.toFixed(decimals) !==
              Number(price).toFixed(decimals)
            ) {
              return { ...prevPrices, [topic]: Number(price) }
            }
            return prevPrices
          })
        }
      )
      setAttempted((prev) => ({ ...prev, [topic]: true }))
    },
    [attempted, priceReporter]
  )

  const handleGetPrice = (exchange: Exchange, base: string, quote: string) => {
    const topic = getTopic(exchange, base, quote)
    return prices[topic]
  }

  return (
    <PriceContext.Provider
      value={{ priceReporter, handleSubscribe, handleGetPrice }}
    >
      {children}
    </PriceContext.Provider>
  )
}

export const usePrice = () => {
  const context = useContext(PriceContext)
  if (!context) {
    throw new Error("usePrice must be used within a PriceProvider")
  }
  return context
}

function getTopic(exchange: Exchange, base: string, quote: string) {
  return `${exchange}-${base}-${quote}`
}
