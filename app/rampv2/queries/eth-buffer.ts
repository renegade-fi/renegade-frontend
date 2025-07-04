import { getSDKConfig } from "@renegade-fi/react";
import { queryOptions } from "@tanstack/react-query";
import { encodeFunctionData, formatEther } from "viem";
import type { Config } from "wagmi";
import { estimateGas, getGasPrice } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { resolveTicker } from "@/lib/token";

const USDC_ADDRESS = resolveTicker("USDC").address as `0x${string}`;

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

export interface ApproveBufferParams {
    config: Config;
    chainId: number;
    approvals: number;
}

export function approveBufferQueryOptions(params: ApproveBufferParams) {
    const sdkCfg = getSDKConfig(params.chainId);
    const spender = sdkCfg.permit2Address as `0x${string}`;
    const amount = BigInt(1) << (BigInt(256) - BigInt(1));
    return queryOptions({
        queryKey: [
            "approveBuffer",
            {
                chainId: params.chainId,
                approvals: params.approvals,
            },
        ],
        queryFn: async () => {
            const approveCalldata = encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [spender, amount],
            });

            const [gasPrice, approveGas] = await Promise.all([
                getGasPrice(params.config),
                estimateGas(params.config, {
                    to: USDC_ADDRESS,
                    data: approveCalldata,
                    chainId: params.chainId,
                }),
            ]);

            const bufferWei = approveGas * gasPrice * BigInt(params.approvals);
            return formatEther(bufferWei);
        },
        retry: true,
    });
}
