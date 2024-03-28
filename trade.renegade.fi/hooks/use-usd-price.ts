import { usePrice } from "@/contexts/PriceContext/price-context"
import { Exchange } from "@renegade-fi/renegade-js"
import { useEffect, useMemo, useState } from "react"

export const useUSDPrice = (base: string, amount: number) => {
  const [price, setPrice] = useState(0)

  const { handleSubscribe, handleGetPrice } = usePrice()
  const priceReport = handleGetPrice(Exchange.Binance, base, "USDC")
  useEffect(() => {
    if (!priceReport) return
    setPrice(priceReport)
  }, [priceReport])
  useEffect(() => {
    handleSubscribe(Exchange.Binance, base, "USDC", 2)
  }, [base, handleSubscribe])

  const formattedPrice = useMemo(() => {
    let basePrice

    if (price) {
      basePrice = price
    } else if (base === "USDC") {
      basePrice = 1
    } else {
      basePrice = 0
    }

    let totalPrice = basePrice * amount

    let formattedPriceStr = totalPrice.toFixed(2)
    const priceStrParts = formattedPriceStr.split(".")

    // Add commas for thousands separation
    priceStrParts[0] = priceStrParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    return priceStrParts.join(".")
  }, [amount, base, price])

  return formattedPrice
}
