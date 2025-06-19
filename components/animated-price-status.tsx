import type { Exchange } from "@renegade-fi/react";

import { usePriceQuery } from "@/hooks/use-price-query";
import { getPriceStatus } from "@/lib/price-status";
import { cn } from "@/lib/utils";

export function AnimatedPriceStatus({
    className,
    exchange = "renegade",
    mint,
}: {
    className?: string;
    exchange?: Exchange;
    mint: `0x${string}`;
}) {
    const { data: price, isStale, isFetchedAfterMount } = usePriceQuery(mint, exchange);
    const { text, statusColor } = getPriceStatus({
        price,
        // Optimistically give price a chance to update before displaying stale status
        isStale: isFetchedAfterMount && isStale,
        mint,
        exchange,
    });

    return <span className={cn("transition-colors", className, statusColor)}>{text}</span>;
}
