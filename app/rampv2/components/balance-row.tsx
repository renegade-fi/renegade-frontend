import { useQuery } from "@tanstack/react-query";
import { formatEther, parseEther } from "viem";
import { TooltipButton } from "@/components/tooltip-button";
import { cn } from "@/lib/utils";
import { isETH } from "../helpers";
import {
    type QueryParams as OnChainBalanceQueryParams,
    onChainBalanceQuery,
} from "../queries/on-chain-balance";
import {
    type QueryParams as RenegadeBalanceQueryParams,
    renegadeBalanceQuery,
} from "../queries/renegade-balance";
import { getTokenByAddress } from "../token-registry";
import { ExternalTransferDirection } from "../types";
import { NetworkLabel } from "./network-label";

interface Props {
    onClick: (amount: string) => void;
    hideNetworkLabel?: boolean;
    minRemainingEthBalance?: string;
    direction: ExternalTransferDirection;
    allowZero?: boolean;
}

export function BalanceRow(props: Props & OnChainBalanceQueryParams & RenegadeBalanceQueryParams) {
    const { data: onChainBalance, isSuccess: onChainBalanceSuccess } = useQuery({
        ...onChainBalanceQuery(props),
    });

    const { data: renegadeBalance, isSuccess: renegadeBalanceSuccess } = useQuery({
        ...renegadeBalanceQuery(props),
    });
    const isSuccess = onChainBalanceSuccess && renegadeBalanceSuccess;

    if (
        !isSuccess ||
        (!props.allowZero &&
            props.direction === ExternalTransferDirection.Deposit &&
            onChainBalance?.isZero) ||
        (props.direction === ExternalTransferDirection.Withdraw && renegadeBalance?.isZero)
    ) {
        return null;
    }

    let roundedLabel = "--";
    let decimalCorrectedLabel = "--";
    if (isSuccess) {
        if (props.direction === ExternalTransferDirection.Deposit) {
            roundedLabel = `${onChainBalance?.rounded} ${onChainBalance?.ticker}`;
            decimalCorrectedLabel = `${onChainBalance?.decimalCorrected} ${onChainBalance?.ticker}`;
        } else {
            roundedLabel = `${renegadeBalance?.rounded} ${renegadeBalance?.ticker}`;
            decimalCorrectedLabel = `${renegadeBalance?.decimalCorrected} ${renegadeBalance?.ticker}`;
        }
    }

    function handleClick() {
        if (isSuccess) {
            const isEth = isETH(props.mint, props.chainId);
            if (isEth && props.direction === ExternalTransferDirection.Deposit) {
                // Compute swap value leaving at least the minimum ETH buffer untouched
                const bufferWei = parseEther(props.minRemainingEthBalance ?? "0");
                const swapAmount = onChainBalance?.raw - bufferWei;
                if (swapAmount > BigInt(0)) {
                    const formatted = formatEther(swapAmount);
                    props.onClick(formatted);
                }
            } else {
                props.onClick(
                    props.direction === ExternalTransferDirection.Deposit
                        ? (onChainBalance?.decimalCorrected ?? "0")
                        : (renegadeBalance?.decimalCorrected ?? "0"),
                );
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
                {props.direction === ExternalTransferDirection.Deposit ? (
                    <NetworkLabel chainId={props.chainId} />
                ) : (
                    "Renegade"
                )}
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
