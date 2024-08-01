import { useBackOfQueueWallet } from "@renegade-fi/react"
import { MAX_ORDERS } from "@renegade-fi/react/constants"

export function useIsMaxOrders() {
    const { data } = useBackOfQueueWallet({
        query: {
            select: data =>
                data.orders.filter(order => order.amount).length === MAX_ORDERS,
        },
    })

    return Boolean(data)
}
