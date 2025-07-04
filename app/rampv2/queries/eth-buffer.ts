import { queryOptions } from "@tanstack/react-query";
import { zeroAddress } from "viem";
import type { Config } from "wagmi";
import { estimateGas } from "wagmi/actions";

const MULTIPLIER = 10;

export interface QueryParams {
    config: Config;
    chainId: number;
    /**
     * (Optional) account address to simulate the transfer from.
     * Providing a real address helps nodes perform balance-related checks accurately,
     * but leaving it undefined is still safe because we send 0 value.
     */
    account?: `0x${string}`;
}

export function ethBufferQueryOptions(params: QueryParams) {
    return queryOptions({
        queryKey: [
            "ethBuffer",
            { chainId: params.chainId, account: params.account, multiplier: MULTIPLIER },
        ],
        queryFn: async () => {
            const gas = await estimateGas(params.config, {
                account: params.account,
                // Self-transfer if account provided; otherwise zero address is fine.
                to: (params.account ?? zeroAddress) as `0x${string}`,
                value: BigInt(0),
                chainId: params.chainId,
            });
            return gas * BigInt(MULTIPLIER);
        },
    });
}
