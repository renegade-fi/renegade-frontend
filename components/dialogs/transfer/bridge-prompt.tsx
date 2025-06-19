import type { Token } from "@renegade-fi/token-nextjs";
import { ExternalLink } from "lucide-react";

import { constructArbitrumBridgeUrl } from "@/components/dialogs/transfer/helpers";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useChainName } from "@/hooks/use-chain-name";
import { TRANSFER_DIALOG_BRIDGE_TOOLTIP } from "@/lib/constants/tooltips";
import { cn } from "@/lib/utils";

export function BridgePrompt({
    token,
    formattedL1Balance,
}: {
    token?: InstanceType<typeof Token>;
    formattedL1Balance: string;
}) {
    const chainName = useChainName(true /* short */);
    if (!token) return null;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    className={cn(
                        "group flex justify-between gap-4 border p-3 text-muted-foreground transition-colors hover:cursor-pointer hover:border-primary hover:text-primary",
                    )}
                    href={constructArbitrumBridgeUrl(formattedL1Balance, token.address)}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                            {`Bridge ${token.ticker} to Arbitrum to deposit`}
                        </div>
                        <div className="text-[0.8rem]">Powered by Arbitrum Bridge</div>
                    </div>
                    <div className="flex flex-1 justify-end">
                        <ExternalLink className="h-3 w-3" />
                    </div>
                </a>
            </TooltipTrigger>
            <TooltipContent>{TRANSFER_DIALOG_BRIDGE_TOOLTIP(chainName)}</TooltipContent>
        </Tooltip>
    );
}
