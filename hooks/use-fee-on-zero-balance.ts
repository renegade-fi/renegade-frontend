import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";

export function useFeeOnZeroBalance() {
    const { data } = useBackOfQueueWallet({
        query: {
            select: (data) =>
                data.balances
                    .filter((balance) => balance.amount === BigInt(0))
                    .some(
                        (balance) =>
                            balance.protocol_fee_balance > BigInt(0) ||
                            balance.relayer_fee_balance > BigInt(0),
                    ),
        },
    });

    return Boolean(data);
}
