import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { NetworkLabel } from "@/components/dialogs/transfer/network-display";
import { TooltipButton } from "@/components/tooltip-button";
import { cn } from "@/lib/utils";
import { isETH } from "../helpers";
import {
    type QueryParams as EthBufferQueryParams,
    ethBufferQueryOptions,
} from "../queries/eth-buffer";
import {
    type QueryParams as OnChainBalanceQueryParams,
    onChainBalanceQuery,
} from "../queries/on-chain-balance";
import { getTokenByAddress } from "../token-registry";

interface Props {
    onClick: (amount: string) => void;
    hideNetworkLabel?: boolean;
}

export function BalanceRow(props: Props & OnChainBalanceQueryParams & EthBufferQueryParams) {
    const { data: balance, isSuccess } = useQuery({
        ...onChainBalanceQuery(props),
    });

    const roundedLabel = isSuccess ? `${balance.rounded} ${balance.ticker}` : "--";
    const decimalCorrectedLabel = isSuccess
        ? `${balance.decimalCorrected} ${balance.ticker}`
        : "--";

    const { data: minRemainingEthBalance } = useQuery({
        ...ethBufferQueryOptions({
            config: props.config,
            chainId: props.chainId,
        }),
    });

    function handleClick() {
        if (isSuccess) {
            const isEth = isETH(props.mint, props.chainId);
            if (isEth) {
                // Compute swap value such that the remaining balance is greater than the minimum remaining balance
                const swapAmount = balance.raw - (minRemainingEthBalance ?? BigInt(0));
                console.log("swapAmount", {
                    minRemainingEthBalance,
                    balance: balance.raw,
                    swapAmount,
                });
                if (swapAmount > BigInt(0)) {
                    const formatted = formatEther(swapAmount);
                    props.onClick(formatted);
                }
            } else {
                props.onClick(balance.decimalCorrected);
            }
        }
    }

    const token = getTokenByAddress(props.mint, props.chainId);
    if (!token) return null;
    return (
        <div className={cn("flex justify-between", props.hideNetworkLabel && "flex-row-reverse")}>
            <div
                className={cn(
                    "flex items-center gap-1 text-sm text-muted-foreground",
                    props.hideNetworkLabel && "hidden",
                )}
            >
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
