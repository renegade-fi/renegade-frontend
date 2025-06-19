import { MAX_ORDERS } from "@renegade-fi/react/constants";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";

export function useIsMaxOrders() {
    const { data } = useBackOfQueueWallet({
        query: {
            select: (data) => data.orders.filter((order) => order.amount).length === MAX_ORDERS,
        },
    });

    return Boolean(data);
}
