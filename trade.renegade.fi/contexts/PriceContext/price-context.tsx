import { PriceReporterWs } from "@renegade-fi/renegade-js"
import React, { createContext, useContext, useEffect, useState } from "react"

const PriceContext = createContext<{
  priceReporter: PriceReporterWs | null
} | null>(null)

export const usePrice = () => {
  const context = useContext(PriceContext)
  if (!context) {
    throw new Error("usePrice must be used within a PriceProvider")
  }
  return context
}

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  const [priceReporter, setPriceReporter] = useState<PriceReporterWs | null>(
    null
  )
  useEffect(() => {
    const priceReporter = new PriceReporterWs()
    setPriceReporter(priceReporter)
    return () => {
      priceReporter.teardown()
    }
  }, [])

  return (
    <PriceContext.Provider value={{ priceReporter }}>
      {children}
    </PriceContext.Provider>
  )
}
