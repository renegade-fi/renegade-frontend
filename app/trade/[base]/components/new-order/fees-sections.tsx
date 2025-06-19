import NumberFlow from "@number-flow/react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { HELP_CENTER_ARTICLES } from "@/lib/constants/articles";
import { TOTAL_RENEGADE_FEE_BPS } from "@/lib/constants/protocol";
import { FEES_SECTION_FEES, FEES_SECTION_TOTAL_SAVINGS } from "@/lib/constants/tooltips";
import { formatCurrency } from "@/lib/format";
import { getCanonicalExchange } from "@/lib/token";
import { cn } from "@/lib/utils";

export function FeesSection({
    predictedSavings,
    predictedSavingsBps,
    relayerFee,
    protocolFee,
    amount,
    base,
}: {
    predictedSavings: number;
    predictedSavingsBps: number;
    relayerFee: number;
    protocolFee: number;
    amount: string;
    base: `0x${string}`;
}) {
    const totalFees = relayerFee + protocolFee;
    const feeLabel = totalFees ? formatCurrency(totalFees) : "--";
    const canonicalExchange = getCanonicalExchange(base);

    return (
        <>
            <div className={cn("flex justify-between transition-colors")}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            className="h-5 cursor-pointer p-0 text-muted-foreground"
                            type="button"
                            variant="link"
                        >
                            <a
                                href={HELP_CENTER_ARTICLES.FEES.url}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Fee
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{FEES_SECTION_FEES}</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span>{amount ? feeLabel : "--"}</span>
                    </TooltipTrigger>
                    <TooltipContent>{amount ? `${TOTAL_RENEGADE_FEE_BPS} bps` : ""}</TooltipContent>
                </Tooltip>
            </div>
            <div className="relative flex justify-between transition-colors">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            className="h-5 cursor-pointer p-0 text-muted-foreground"
                            type="button"
                            variant="link"
                        >
                            <a
                                href={HELP_CENTER_ARTICLES.SAVINGS_VS_BINANCE.url}
                                rel="noreferrer"
                                target="_blank"
                            >
                                Total Savings vs. {canonicalExchange}
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{FEES_SECTION_TOTAL_SAVINGS}</TooltipContent>
                </Tooltip>
                <div
                    className={cn("text-green-price transition-opacity", {
                        "opacity-0": !predictedSavings || !amount,
                    })}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <NumberFlow
                                format={{
                                    style: "currency",
                                    currency: "USD",
                                    minimumFractionDigits:
                                        predictedSavings > 10_000
                                            ? 0
                                            : predictedSavings < 10
                                              ? 4
                                              : 2,
                                    maximumFractionDigits:
                                        predictedSavings > 10_000
                                            ? 0
                                            : predictedSavings < 10
                                              ? 4
                                              : 2,
                                }}
                                locales="en-US"
                                value={predictedSavings}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            {predictedSavingsBps
                                ? `${Math.round(predictedSavingsBps)} bps`
                                : "0 bps"}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <span
                    className={cn("absolute right-0 transition-opacity", {
                        "opacity-0": predictedSavings && amount,
                    })}
                >
                    --
                </span>
            </div>
        </>
    );
}
