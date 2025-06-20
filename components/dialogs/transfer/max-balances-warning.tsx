import { AlertTriangle } from "lucide-react";

import { useIsMaxBalances } from "@/components/dialogs/transfer/use-is-max-balances";
import {
    ResponsiveTooltip,
    ResponsiveTooltipContent,
    ResponsiveTooltipTrigger,
} from "@/components/ui/responsive-tooltip";

import { MAX_BALANCES_TOOLTIP } from "@/lib/constants/tooltips";
import { cn } from "@/lib/utils";

export function MaxBalancesWarning({ className, mint }: { className?: string; mint: string }) {
    const isMaxBalances = useIsMaxBalances(mint);

    if (isMaxBalances) {
        return (
            <div className="flex w-full items-center justify-center rounded-md bg-[#2A1700] p-3 text-center">
                <ResponsiveTooltip>
                    <ResponsiveTooltipTrigger onClick={(e) => e.preventDefault()}>
                        <div className={cn("flex items-center gap-2", className)}>
                            <AlertTriangle className="h-4 w-4" />
                            <span>Maximum balance limit reached.</span>
                        </div>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent>{MAX_BALANCES_TOOLTIP}</ResponsiveTooltipContent>
                </ResponsiveTooltip>
            </div>
        );
    }

    return null;
}
