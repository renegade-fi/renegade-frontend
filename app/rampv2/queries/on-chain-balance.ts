import { type Connection, PublicKey } from "@solana/web3.js";
import { queryOptions } from "@tanstack/react-query";
import { formatUnits } from "viem";
import type { Config } from "wagmi";
import { getBalance } from "wagmi/actions";
import { formatNumber } from "@/lib/format";
import { readErc20BalanceOf } from "@/lib/generated";
import { solana } from "@/lib/viem";
import { isETH } from "../helpers";
import { getTokenByAddress } from "../token-registry";

export interface QueryParams {
    owner: string;
    mint: string;
    chainId: number;
    wagmiConfig?: Config;
    connection?: Connection;
}

export function onChainBalanceQuery(params: QueryParams) {
    return queryOptions({
        queryKey: [
            "readContract",
            {
                address: params.mint,
                args: [params.owner],
                chainId: params.chainId,
                functionName: "balanceOf",
            },
        ],
        queryFn: async () => {
            if (params.chainId === solana.id) {
                if (!params.connection)
                    throw new Error("Connection is required to read Solana balance");
                const balance = await readSolanaBalanceOf(params.connection, {
                    owner: params.owner,
                    mint: params.mint,
                });
                return balance;
            } else {
                if (!params.wagmiConfig)
                    throw new Error("Wagmi config is required to read EVM balance");
                if (isETH(params.mint, params.chainId)) {
                    const balance = await getBalance(params.wagmiConfig, {
                        address: params.owner as `0x${string}`,
                    });
                    return balance.value;
                }
                const balance = await readErc20BalanceOf(params.wagmiConfig, {
                    address: params.mint as `0x${string}`,
                    args: [params.owner as `0x${string}`],
                    chainId: params.chainId,
                });
                return balance;
            }
        },
        select: (data) => {
            const raw = data ?? BigInt(0);
            const maybeToken = getTokenByAddress(params.mint, params.chainId);
            if (!maybeToken) return { raw, decimalCorrected: "0", rounded: "0", ticker: "" };
            const decimalCorrected = formatUnits(raw, maybeToken.decimals);
            const rounded = formatNumber(raw, maybeToken.decimals);
            return { raw, decimalCorrected, rounded, ticker: maybeToken.ticker };
        },
        staleTime: 0,
    });
}

async function readSolanaBalanceOf(
    connection: Connection,
    params: {
        owner: string;
        mint: string;
    },
) {
    const owner = new PublicKey(params.owner);
    const mint = new PublicKey(params.mint);
    const owners = await connection.getTokenAccountsByOwner(owner, {
        mint,
    });
    const tokenAccountAddress = owners.value[0]?.pubkey;
    const balance = await connection.getTokenAccountBalance(tokenAccountAddress);
    return BigInt(balance.value.amount);
}
