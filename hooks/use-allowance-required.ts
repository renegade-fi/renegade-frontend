import { isAddress } from "viem";
import { useAccount } from "wagmi";

import { safeParseUnits } from "@/lib/format";
import { useReadErc20Allowance } from "@/lib/generated";

export function useAllowanceRequired({
    amount,
    mint,
    spender,
    decimals,
}: {
    amount: string;
    mint: string;
    spender?: string;
    decimals: number;
}) {
    const { address } = useAccount();
    return useReadErc20Allowance({
        address: mint as `0x${string}`,
        args: [address ?? "0x", (spender as `0x${string}`) ?? "0x"],
        query: {
            select: (data) => {
                const parsedAmount = safeParseUnits(amount, decimals);
                if (parsedAmount instanceof Error) return false;
                return parsedAmount > data;
            },
            enabled:
                !!mint &&
                isAddress(mint) &&
                !!address &&
                !!spender &&
                isAddress(spender) &&
                Number(amount) > 0,
            staleTime: 0,
        },
    });
}
