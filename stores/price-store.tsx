"use client"

import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import { Exchange, Token } from "@renegade-fi/react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { StoreApi, createStore, useStore } from "zustand"

import { DISPLAY_TOKENS } from "@/lib/token"

interface PricesState {
  prices: Map<string, number>
  lastUpdated: Map<string, number>
  subscriptions: Set<string>
}

type PricesContextValue = {
  store: StoreApi<PricesState>
  handleSubscribe: ({
    exchange,
    baseAddress,
  }: {
    exchange: Exchange
    baseAddress: `0x${string}`
  }) => void
}

const PriceStoreContext = createContext<PricesContextValue | null>(null)

export const PriceStoreProvider: React.FC<
  PropsWithChildren & {
    initialPrices: Map<string, number>
  }
> = ({ children, initialPrices }) => {
  const [store] = useState(() =>
    createStore<PricesState>()(() => {
      const initialLastUpdated = new Map<string, number>()
      initialPrices.forEach((_, key) => {
        initialLastUpdated.set(key, Date.now())
      })
      return {
        prices: initialPrices ?? new Map(),
        lastUpdated: initialLastUpdated,
        subscriptions: new Set(),
      }
    }),
  )

  const { readyState, sendJsonMessage } = useWebSocket(
    `wss://${process.env.NEXT_PUBLIC_PRICE_REPORTER_URL}:4000`,
    {
      filter: () => false,
      onMessage: event => {
        const data = JSON.parse(event.data)

        if (data.topic && data.price) {
          const { topic, price } = data
          const prevPrice = store.getState().prices.get(topic)
          const priceNeedsUpdate =
            !prevPrice || prevPrice.toFixed(2) !== price.toFixed(2)

          if (priceNeedsUpdate) {
            const lastUpdatedTime = store.getState().lastUpdated.get(topic) ?? 0
            const currentTime = Date.now()
            const randomDelay = Math.floor(
              Math.random() * (3000 - 1000 + 1) + 500,
            )

            if (currentTime - lastUpdatedTime > randomDelay) {
              store.setState(state => ({
                ...state,
                prices: new Map(state.prices).set(topic, price),
                lastUpdated: new Map(state.lastUpdated).set(topic, currentTime),
              }))
            }
          }
        }
        if (data.subscriptions) {
          store.setState(state => ({
            ...state,
            subscriptions: new Set(data.subscriptions),
          }))
        }
      },
      shouldReconnect: () => true,
    },
  )

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      for (const token of DISPLAY_TOKENS({ hideStables: true })) {
        const topic = `binance-${token.address}-${DEFAULT_QUOTE.binance}`
        sendJsonMessage({
          method: "subscribe",
          topic,
        })
      }
    }
  }, [readyState, sendJsonMessage])

  const handleSubscribe = ({
    exchange = "binance",
    baseAddress,
  }: {
    exchange: Exchange
    baseAddress: `0x${string}`
  }) => {
    const topic = `${exchange}-${baseAddress}-${DEFAULT_QUOTE[exchange]}`
    if (!store.getState().subscriptions.has(topic)) {
      sendJsonMessage({
        method: "subscribe",
        topic,
      })
    }
  }

  return (
    <PriceStoreContext.Provider value={{ store, handleSubscribe }}>
      {children}
    </PriceStoreContext.Provider>
  )
}

export const usePrice = ({
  exchange = "binance",
  baseAddress,
}: {
  exchange?: Exchange
  baseAddress: `0x${string}`
}) => {
  const context = useContext(PriceStoreContext)
  if (!context) {
    throw new Error("usePrice must be used within a PriceStoreProvider")
  }

  const { store, handleSubscribe } = context
  const quoteAddress = DEFAULT_QUOTE[exchange]
  const topic = constructPriceTopic({ exchange, baseAddress })
  const price = useStore(store, state => state.prices.get(topic))

  useEffect(() => {
    handleSubscribe({ exchange, baseAddress })
  }, [baseAddress, exchange, handleSubscribe, quoteAddress])

  return price ? price : 0
}

export const usePricesSnapshot = () => {
  const context = useContext(PriceStoreContext)
  if (!context) {
    throw new Error(
      "usePricesSnapshot must be used within a PriceStoreProvider",
    )
  }

  const { store } = context
  return store.getState().prices
}

export const usePrices = () => {
  const context = useContext(PriceStoreContext)
  if (!context) {
    throw new Error(
      "usePricesSnapshot must be used within a PriceStoreProvider",
    )
  }

  const { store } = context
  return useStore(store, state => state.prices)
}

export const useLastUpdated = ({
  exchange = "binance",
  baseAddress,
}: {
  exchange?: Exchange
  baseAddress: `0x${string}`
}) => {
  const context = useContext(PriceStoreContext)
  if (!context) {
    throw new Error("useLastUpdated must be used within a PriceStoreProvider")
  }
  const { store } = context
  const topic = `${exchange}-${baseAddress}-${DEFAULT_QUOTE[exchange]}`
  return useStore(store, state => state.lastUpdated.get(topic)) ?? 0
}

export const DEFAULT_QUOTE: Record<Exchange, `0x${string}`> = {
  binance: Token.findByTicker("USDT").address,
  coinbase: Token.findByTicker("USDC").address,
  kraken: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  okx: Token.findByTicker("USDT").address,
}

export const constructPriceTopic = ({
  exchange = "binance",
  baseAddress,
}: {
  exchange?: Exchange
  baseAddress: `0x${string}`
}) => {
  return `${exchange}-${baseAddress}-${DEFAULT_QUOTE[exchange]}`
}
