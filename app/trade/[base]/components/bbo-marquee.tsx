import type { Exchange } from "@renegade-fi/react";
import { Fragment } from "react";
import { AnimatedPrice } from "@/components/animated-price";
import { AnimatedPriceStatus } from "@/components/animated-price-status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EXCHANGES, exchangeToName } from "@/lib/constants/protocol";
import { BBO_TOOLTIP } from "@/lib/constants/tooltips";
import { constructExchangeUrl } from "@/lib/exchange-urls";
import { getCanonicalExchange, resolveAddress } from "@/lib/token";

/**
 * If the given exchange is the canonical exchange, return "renegade"
 * This ensures the canonical price is shown on the BBO marquee.
 */
export function overwriteCanonicalExchange(mint: `0x${string}`, exchange: Exchange) {
    const token = resolveAddress(mint);
    const canonicalExchange = token.canonicalExchange;
    if (canonicalExchange.toLowerCase() === exchange.toLowerCase()) {
        return "renegade";
    }
    return exchange;
}

export function BBOMarquee({ base }: { base: `0x${string}` }) {
    const canonicalExchange = getCanonicalExchange(base);
    return (
        <div className="hidden min-h-marquee grid-cols-[0.5fr_6px_1fr_6px_1fr_6px_1fr_6px_1fr] items-center whitespace-nowrap border-b border-border font-extended text-sm lg:grid">
            <Tooltip>
                <TooltipTrigger>
                    <span className="flex justify-center">BBO Feeds</span>
                </TooltipTrigger>
                <TooltipContent className="font-sans">
                    {BBO_TOOLTIP(canonicalExchange)}
                </TooltipContent>
            </Tooltip>
            {EXCHANGES.map((exchange) => (
                <Fragment key={exchange}>
                    <span className="text-xs">•</span>
                    <a href={constructExchangeUrl(exchange, base)} rel="noreferrer" target="_blank">
                        <div className="flex items-baseline justify-center gap-4 leading-none">
                            <span>{exchangeToName[exchange]}</span>
                            <AnimatedPrice
                                className="font-mono"
                                exchange={overwriteCanonicalExchange(base, exchange)}
                                mint={base}
                            />
                            <AnimatedPriceStatus
                                className="font-extended text-green-price"
                                exchange={overwriteCanonicalExchange(base, exchange)}
                                mint={base}
                            />
                        </div>
                    </a>
                </Fragment>
            ))}
        </div>
    );
}
