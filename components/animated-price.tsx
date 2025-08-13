import type { Exchange } from "@renegade-fi/react";
import * as React from "react";
import { createPriceFormatter } from "@/app/trade/[base]/components/charts/fills/helpers";
import { usePriceQuery } from "@/hooks/use-price-query";
import { formatDynamicCurrency } from "@/lib/format";
import { getPriceStatus } from "@/lib/price-status";
import { resolveAddress, USDT_TICKER } from "@/lib/token";
import { cn } from "@/lib/utils";

export function AnimatedPrice({
    className,
    mint,
    exchange = "renegade",
}: {
    className?: string;
    exchange?: Exchange;
    mint: `0x${string}`;
}) {
    const { data: price, isStale } = usePriceQuery(mint, exchange);
    const prev = React.useRef(price);
    const [animationKey, setAnimationKey] = React.useState(0);

    React.useEffect(() => {
        if (price !== prev.current) {
            // Use requestAnimationFrame to batch DOM updates
            requestAnimationFrame(() => {
                setAnimationKey((prevKey) => prevKey + 1);
                requestAnimationFrame(() => {
                    prev.current = price; // Update ref after the browser has painted
                });
            });
        }
    }, [price]);

    const { priceColor } = getPriceStatus({ exchange, isStale, mint, price });

    // If the token is USDT, use the price formatter that shows more decimal places
    let priceFormatter = formatDynamicCurrency;
    if (resolveAddress(mint).ticker === USDT_TICKER) {
        priceFormatter = createPriceFormatter();
    }

    return (
        <span
            className={cn("transition-colors", className, priceColor, {
                "animate-price-green": price > prev.current,
                "animate-price-red": price < prev.current,
            })}
            key={animationKey}
        >
            {priceFormatter(price)}
        </span>
    );
}
