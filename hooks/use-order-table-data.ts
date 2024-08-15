import { OrderData } from "@/app/orders/page-client"
import { amountTimesPrice } from "@/hooks/use-usd-price"
import { constructPriceTopic, usePrice, usePrices } from "@/stores/price-store"
import { Token, useOrderHistory } from "@renegade-fi/react"
import { formatUnits } from "viem/utils"

export function useOrderTableData() {
    const { data } = useOrderHistory({
        query: {
            select: (data) => Array.from(data?.values() || []),
        },
    })
    const prices = usePrices()
    // Subscribe to USDC price
    usePrice({
        baseAddress: Token.findByTicker("USDC").address,
    })
    const orderData: OrderData[] =
        data?.map((order) => {
            const priceTopic = constructPriceTopic({
                baseAddress: order.data.base_mint,
            })
            const price = prices.get(priceTopic) || 0
            const usdValueBigInt = amountTimesPrice(order.data.amount, price)
            const decimals = Token.findByAddress(order.data.base_mint).decimals
            const usdValue = formatUnits(usdValueBigInt, decimals)

            return {
                ...order,
                usdValue,
            }
        }) || []
    return orderData
}