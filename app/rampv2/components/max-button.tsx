import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { onChainBalanceQuery, type QueryParams } from "../queries/on-chain-balance";
import { type QueryParamsWithMint, renegadeBalanceQuery } from "../queries/renegade-balance";
import { ExternalTransferDirection } from "../types";

interface Props {
    onClick: (amount: string) => void;
    direction: ExternalTransferDirection;
}
export function MaxButton(props: Props & QueryParams & QueryParamsWithMint) {
    const { data: onChainBalance, isSuccess: isOnChainBalanceSuccess } = useQuery({
        ...onChainBalanceQuery(props),
    });

    const { data: renegadeBalance, isSuccess: isRenegadeBalanceSuccess } = useQuery({
        ...renegadeBalanceQuery(props),
    });

    const isDeposit = props.direction === ExternalTransferDirection.Deposit;

    const handleClick = () => {
        if (isDeposit) {
            if (isOnChainBalanceSuccess) {
                props.onClick(onChainBalance.decimalCorrected);
            }
        } else {
            if (isRenegadeBalanceSuccess) {
                props.onClick(renegadeBalance.decimalCorrected);
            }
        }
    };

    let isDisabled = false;
    if (isDeposit) {
        isDisabled = !isOnChainBalanceSuccess;
    } else {
        isDisabled = !isRenegadeBalanceSuccess;
    }

    return (
        <Button
            className="absolute right-2 top-1/2 h-7 -translate-y-1/2 text-muted-foreground"
            disabled={!isOnChainBalanceSuccess}
            onClick={handleClick}
            size="icon"
            variant="ghost"
        >
            MAX
        </Button>
    );
}
