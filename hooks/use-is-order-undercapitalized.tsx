import { formatUnits } from "viem/utils";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { amountTimesPrice } from "@/hooks/use-usd-price";
import { Side } from "@/lib/constants/protocol";
import { resolveAddress } from "@/lib/token";

export function useIsOrderUndercapitalized({
    amount,
    baseMint,
    quoteMint,
    side,
    basePerQuote,
}: {
    amount: bigint;
    baseMint: `0x${string}`;
    quoteMint: `0x${string}`;
    side: Side;
    basePerQuote: number;
}) {
    const baseToken = resolveAddress(baseMint);
    const quoteToken = resolveAddress(quoteMint);
    const token = side === Side.BUY ? quoteToken : baseToken;

    const { data: balance } = useBackOfQueueWallet({
        query: {
            select: (data) =>
                data.balances.find((balance) => balance.mint === token.address)?.amount,
        },
    });

    const notionalValue = amountTimesPrice(amount, basePerQuote); // in units of the input amount

    const isUndercapitalized = (() => {
        if (side === Side.BUY) {
            const formattedUsdPrice = formatUnits(
                notionalValue,
                side === Side.BUY ? baseToken.decimals : quoteToken.decimals,
            );
            return balance
                ? parseFloat(formatUnits(balance, token.decimals)) < parseFloat(formattedUsdPrice)
                : true;
        } else {
            return balance ? balance < amount : true;
        }
    })();

    return {
        isUndercapitalized,
        token,
    };
}
