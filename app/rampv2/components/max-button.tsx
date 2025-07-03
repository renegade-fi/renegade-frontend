import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { onChainBalanceQuery, type QueryParams } from "../queries/on-chain-balance";

interface Props {
    onClick: (amount: string) => void;
}
export function MaxButton(props: Props & QueryParams) {
    const { data, isSuccess } = useQuery({
        ...onChainBalanceQuery(props),
    });

    const handleClick = () => {
        if (isSuccess) {
            props.onClick(data.decimalCorrected);
        }
    };

    return (
        <Button
            disabled={!isSuccess}
            size="icon"
            variant="ghost"
            className="absolute right-2 top-1/2 h-7 -translate-y-1/2 text-muted-foreground"
            onClick={handleClick}
        >
            MAX
        </Button>
    );
}
