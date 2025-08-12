import { getSDKConfig } from "@renegade-fi/react";
import type { ChainId } from "@renegade-fi/react/constants";
import { queryOptions } from "@tanstack/react-query";
import type { Config } from "wagmi";
import { readArbitrumDarkpoolGetFee, readBaseDarkpoolGetProtocolFee } from "@/lib/generated";

/** * Converts a decimal number to a basis point number */
const DECIMAL_TO_BPS = 10_000;

/** The default fixed point precision for fixed point numbers */
const DEFAULT_FP_PRECISION = 2 ** 63;

interface QueryParams {
    config: Config;
    chainId: ChainId;
}

/**
 * Returns the protocol fee for the given chain ID
 * @param params - The query parameters
 * @returns The protocol fee in basis points
 */
export function protocolFeeQueryOptions(params: QueryParams) {
    const sdkCfg = getSDKConfig(params.chainId);
    const darkpool = sdkCfg.darkpoolAddress;
    return queryOptions({
        queryFn: async () => {
            let protocolFee = BigInt(0);
            switch (params.chainId) {
                case 42161:
                case 421614: {
                    protocolFee = await readArbitrumDarkpoolGetFee(params.config, {
                        address: darkpool,
                    });
                    break;
                }
                case 8453:
                case 84532: {
                    protocolFee = await readBaseDarkpoolGetProtocolFee(params.config, {
                        address: darkpool,
                    });
                    break;
                }
                default: {
                    throw new Error(`Unsupported chain ID: ${params.chainId}`);
                }
            }

            // From renegade-contracts:
            // The protocol fee, representing a percentage of the trade volume
            // as a fixed-point number shifted by 63 bits.
            //
            // I.e., the fee is `protocol_fee / 2^63`
            const feeDecimal = Number(protocolFee) / DEFAULT_FP_PRECISION;

            const feeBps = Math.ceil(feeDecimal * DECIMAL_TO_BPS);

            return feeBps;
        },
        queryKey: [
            "protocolFee",
            {
                chainId: params.chainId,
            },
        ],
        retry: true,
        staleTime: Number.POSITIVE_INFINITY,
    });
}
