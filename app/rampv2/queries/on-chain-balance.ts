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
        queryFn: () => fetchBalance(params),
        queryKey: [
            "readContract",
            {
                address: params.mint,
                args: [params.owner],
                chainId: params.chainId,
                functionName: "balanceOf",
            },
        ],
        select: (data) => formatBalance(data, params),
        staleTime: 0,
    });
}

async function fetchBalance(params: QueryParams): Promise<bigint> {
    if (params.chainId === solana.id) {
        return fetchSolanaBalance(params.connection, params.owner, params.mint);
    }

    return fetchEvmBalance(params.wagmiConfig, params.owner, params.mint, params.chainId);
}

async function fetchSolanaBalance(
    connection: Connection | undefined,
    owner: string,
    mint: string,
): Promise<bigint> {
    if (!connection) {
        throw new Error("Connection is required to read Solana balance");
    }

    const ownerKey = new PublicKey(owner);
    const mintKey = new PublicKey(mint);
    const accounts = await connection.getTokenAccountsByOwner(ownerKey, { mint: mintKey });
    const tokenAccount = accounts.value[0]?.pubkey;
    if (!tokenAccount) {
        return BigInt(0);
    }
    const { value } = await connection.getTokenAccountBalance(tokenAccount);
    return BigInt(value.amount);
}

async function fetchEvmBalance(
    config: Config | undefined,
    owner: string,
    mint: string,
    chainId: number,
): Promise<bigint> {
    if (!config) {
        throw new Error("Wagmi config is required to read EVM balance");
    }

    if (isETH(mint, chainId)) {
        const { value } = await getBalance(config, {
            address: owner as `0x${string}`,
        });
        return value;
    }

    const result = await readErc20BalanceOf(config, {
        address: mint as `0x${string}`,
        args: [owner as `0x${string}`],
        chainId,
    });
    return result;
}

function formatBalance(rawData: bigint | number | undefined, params: QueryParams) {
    const raw = typeof rawData === "bigint" ? rawData : BigInt(rawData ?? 0);
    const token = getTokenByAddress(params.mint, params.chainId);

    if (!token) {
        return {
            decimalCorrected: "0",
            isZero: true,
            raw,
            rounded: "0",
            ticker: "",
        };
    }

    const decimalCorrected = formatUnits(raw, token.decimals);
    const rounded = formatNumber(raw, token.decimals);

    return {
        decimalCorrected,
        isZero: raw === BigInt(0),
        raw,
        rounded,
        ticker: token.ticker,
    };
}
