import { getSDKConfig } from "@renegade-fi/react";
import { queryOptions } from "@tanstack/react-query";
import { encodeFunctionData, formatEther } from "viem";
import type { Config } from "wagmi";
import { estimateGas, getGasPrice } from "wagmi/actions";
import { erc20Abi } from "@/lib/generated";
import { resolveTicker } from "@/lib/token";

const USDC_ADDRESS = resolveTicker("USDC").address as `0x${string}`;

interface QueryParams {
    config: Config;
    chainId: number;
    approvals: number;
}

export function approveBufferQueryOptions(params: QueryParams) {
    const sdkCfg = getSDKConfig(params.chainId);
    const spender = sdkCfg.permit2Address as `0x${string}`;
    const amount = BigInt(1) << (BigInt(256) - BigInt(1));
    return queryOptions({
        queryFn: async () => {
            const approveCalldata = encodeFunctionData({
                abi: erc20Abi,
                args: [spender, amount],
                functionName: "approve",
            });

            const [gasPrice, approveGas] = await Promise.all([
                getGasPrice(params.config),
                estimateGas(params.config, {
                    chainId: params.chainId,
                    data: approveCalldata,
                    to: USDC_ADDRESS,
                }),
            ]);

            const bufferWei = approveGas * gasPrice * BigInt(params.approvals);
            const etherValue = formatEther(bufferWei);
            const num = parseFloat(etherValue);
            const formatter = new Intl.NumberFormat("en-US", {
                maximumSignificantDigits: 2,
                minimumSignificantDigits: 2,
            });
            return formatter.format(num);
        },
        queryKey: [
            "approveBuffer",
            {
                approvals: params.approvals,
                chainId: params.chainId,
            },
        ],
        retry: true,
    });
}
