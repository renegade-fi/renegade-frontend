import { RampDialog } from "@/app/rampv2/ramp-dialog";
import { Button } from "@/components/ui/button";
import {
    ResponsiveTooltip,
    ResponsiveTooltipContent,
    ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip";

import { useIsOrderUndercapitalized } from "@/hooks/use-is-order-undercapitalized";
import { Side } from "@/lib/constants/protocol";
import { UNDERCAPITALIZED_ORDER_TOOLTIP } from "@/lib/constants/tooltips";
import { cn } from "@/lib/utils";

export function InsufficientWarning({
    amount,
    baseMint,
    className,
    quoteMint,
    richColors = false,
    side,
    withDialog = false,
}: {
    amount: bigint;
    baseMint: `0x${string}`;
    className?: string;
    quoteMint: `0x${string}`;
    richColors?: boolean;
    side: Side;
    withDialog?: boolean;
}) {
    const { isUndercapitalized, token } = useIsOrderUndercapitalized({
        amount,
        baseMint,
        quoteMint,
        side,
    });

    if (!isUndercapitalized) return null;

    const warningContent = (
        <div
            className={cn(
                "flex items-center gap-2",
                {
                    "w-full justify-center rounded-md bg-[#2A1700] p-3 text-center": richColors,
                },
                className,
            )}
        >
            <div className="h-2 w-2 rounded-full bg-[var(--color-yellow)]" />
            <span>Only part of the order will be filled.</span>
        </div>
    );

    return (
        <ResponsiveTooltip>
            <ResponsiveTooltipTrigger className={withDialog ? "" : "cursor-default"}>
                {withDialog ? (
                    <RampDialog initialMint={side === Side.BUY ? quoteMint : baseMint}>
                        <Button variant="ghost">{warningContent}</Button>
                    </RampDialog>
                ) : (
                    warningContent
                )}
            </ResponsiveTooltipTrigger>
            <ResponsiveTooltipContent>
                {UNDERCAPITALIZED_ORDER_TOOLTIP({
                    ticker: token.ticker,
                })}
            </ResponsiveTooltipContent>
        </ResponsiveTooltip>
    );
}
