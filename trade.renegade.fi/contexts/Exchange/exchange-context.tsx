import { CallbackId, Exchange } from "@renegade-fi/renegade-js"
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { renegade } from "@/app/providers"
import { getToken } from "@/lib/utils"

import { ExchangeContextValue, PriceReport } from "./types"

const UPDATE_THRESHOLD_MS = 1000

const ExchangeContext = createContext<ExchangeContextValue | undefined>(
  undefined
)

function ExchangeProvider({ children }: PropsWithChildren) {
  const callbackIdRefs = useRef<{ [key: string]: CallbackId }>({})
  const [priceReport, setPriceReport] = useState<{
    [key: string]: PriceReport
  }>({})

  const handlePriceListener = useCallback(
    async (
      exchange: Exchange,
      base: string,
      quote: string,
      decimals?: number
    ) => {
      const key = getKey(exchange, base, quote)
      if (callbackIdRefs.current[key]) {
        return
      }

      let lastUpdate = 0

      //   {
      //     "type": "PriceReport",
      //     "baseToken": {
      //         "addr": "0xbeb41fc8fe10b648472cb4b98ed86cb454bf3f3b"
      //     },
      //     "quoteToken": {
      //         "addr": "0x4517bab8ec4976f632569b09193405c322e0ccd0"
      //     },
      //     "price": 3501.5,
      //     "localTimestamp": 1711571700
      // }

      const callbackId = await renegade
        .registerPriceReportCallback(
          (message: string) => {
            // console.log("🚀 ~ ExchangeProvider ~ message:", message)
            const priceReport = JSON.parse(message) as PriceReport
            const now = Date.now()
            if (now - lastUpdate <= UPDATE_THRESHOLD_MS) {
              return
            }
            lastUpdate = now

            // Store the price report if it's different from the previous one
            setPriceReport((prev) => {
              if (
                !prev[key] ||
                prev[key].price?.toFixed(decimals || 2) !==
                  priceReport.price?.toFixed(decimals || 2)
              ) {
                return {
                  ...prev,
                  [key]: priceReport,
                }
              }
              return prev
            })
          },
          exchange,
          getToken({ ticker: base }),
          getToken({ ticker: quote })
        )
        .then((callbackId) => {
          if (callbackId) {
            callbackIdRefs.current[key] = callbackId
            return callbackId
          }
        })
        .catch(() => {
          return undefined
        })
      return callbackId
    },
    []
  )

  useEffect(() => {
    return () => {
      Object.values(callbackIdRefs.current).forEach((callbackId) => {
        renegade.releaseCallback(callbackId)
      })
      callbackIdRefs.current = {}
    }
  }, [handlePriceListener])

  return (
    <ExchangeContext.Provider
      value={{
        onRegisterPriceListener: handlePriceListener,
        getPriceData: (
          exchange: Exchange,
          baseTicker: string,
          quoteTicker: string
        ): PriceReport | undefined => {
          const key = getKey(exchange, baseTicker, quoteTicker)
          return priceReport[key]
        },
      }}
    >
      {children}
    </ExchangeContext.Provider>
  )
}

function useExchange() {
  const context = useContext(ExchangeContext)
  if (context === undefined) {
    throw new Error("useExchange must be used within a ExchangeProvider")
  }
  return context
}

export { ExchangeProvider, useExchange }

function getKey(exchange: Exchange, base: string, quote: string) {
  return `${exchange}-${base}-${quote}`
}
