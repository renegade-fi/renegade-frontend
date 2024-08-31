import { PartialOrderFill } from "@renegade-fi/react";
import { amountTimesPrice } from "@/hooks/use-usd-price";

export function getVWAP(fills: PartialOrderFill[]): number {
    if (fills.length === 0) {
        return 0;
    }

    let totalVolume = BigInt(0);
    let totalValue = BigInt(0);

    for (const fill of fills) {
        const fillVolume = fill.amount;
        const fillValue = amountTimesPrice(fill.amount, fill.price.price);

        totalVolume += fillVolume;
        totalValue += fillValue;
    }

    if (totalVolume === BigInt(0)) {
        return 0;
    }

    return Number(totalValue) / Number(totalVolume);
}