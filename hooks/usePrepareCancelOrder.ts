"use client"

import { stringifyForWasm, useBackOfQueueWallet, useConfig } from "@renegade-fi/react"
import { CancelOrderParameters } from "@renegade-fi/react/actions"
import React from "react"

export type UsePrepareCancelOrderParameters = CancelOrderParameters


export type UsePrepareCancelOrderReturnType = {
    request: string | undefined
}

export function usePrepareCancelOrder(parameters: UsePrepareCancelOrderParameters) {
    const { id } = parameters
    const config = useConfig()
    const { data: wallet, isSuccess } = useBackOfQueueWallet()
    const request = React.useMemo(() => {
        if (!isSuccess) return ""
        if (wallet.orders.find(order => order.id === id)) {
            return config.utils.cancel_order(
                stringifyForWasm(wallet),
                id,
            )
        }
        return undefined
    }, [config, wallet, id, isSuccess])
    return { request }
}