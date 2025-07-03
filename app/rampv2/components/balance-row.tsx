import { useQuery } from "@tanstack/react-query";
import { NetworkLabel } from "@/components/dialogs/transfer/network-display";
import { TooltipButton } from "@/components/tooltip-button";
import { cn } from "@/lib/utils";
import { onChainBalanceQuery, type QueryParams } from "../queries/on-chain-balance";
import { getTokenByAddress } from "../token-registry";

interface Props {
    onClick: (amount: string) => void;
}

export function BalanceRow(props: Props & QueryParams) {
    const { data, isSuccess } = useQuery({
        ...onChainBalanceQuery(props),
    });

    const roundedLabel = isSuccess ? `${data.rounded} ${data.ticker}` : "--";
    const decimalCorrectedLabel = isSuccess ? `${data.decimalCorrected} ${data.ticker}` : "--";

    function handleClick() {
        if (isSuccess) {
            props.onClick(data.decimalCorrected);
        }
    }

    const token = getTokenByAddress(props.mint, props.chainId);
    if (!token) return null;
    return (
        <div className={cn("flex justify-between")}>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Balance on&nbsp;
                <NetworkLabel chainId={props.chainId} />
            </div>
            <div className="flex items-center">
                <TooltipButton
                    className="h-5 p-0 font-mono text-sm"
                    tooltipContent={decimalCorrectedLabel}
                    variant="link"
                    onClick={handleClick}
                >
                    {roundedLabel}
                </TooltipButton>
            </div>
        </div>
    );
}
