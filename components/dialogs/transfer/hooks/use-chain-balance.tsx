import type { Token } from "@renegade-fi/token-nextjs";
import { formatUnits } from "viem/utils";
import { useAccount } from "wagmi";

import { formatNumber } from "@/lib/format";
import { useReadErc20BalanceOf } from "@/lib/generated";

export function useChainBalance({
    chainId,
    token,
    enabled = true,
}: {
    chainId?: number;
    token?: InstanceType<typeof Token>;
    enabled?: boolean;
}) {
    const { address } = useAccount();
    const { data: balance, queryKey } = useReadErc20BalanceOf({
        address: token?.address,
        args: [address ?? "0x"],
        chainId,
        query: {
            enabled: enabled && !!token && !!address,
            staleTime: 0,
        },
    });

    const formattedBalance = token ? formatUnits(balance ?? BigInt(0), token.decimals) : "";
    const balanceLabel = token ? formatNumber(balance ?? BigInt(0), token.decimals, true) : "";

    return {
        bigint: balance,
        string: formattedBalance,
        formatted: balanceLabel,
        nonZero: Boolean(balance && balance !== BigInt(0)),
        queryKey,
    };
}
