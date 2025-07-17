import { isSupportedChainId } from "@renegade-fi/react";
import { CHAIN_SPECIFIERS } from "@renegade-fi/react/constants";
import { encodeFunctionData, parseAbi } from "viem";
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from "viem/chains";

import { env } from "@/env/server";
import { solana } from "@/lib/viem";

const abi = parseAbi(["function balanceOf(address owner) view returns (uint256)"]);

// Mapping of chain IDs to Alchemy subdomain prefixes
const ALCHEMY_SUBDOMAINS = {
    [mainnet.id]: "eth-mainnet",
    [arbitrum.id]: "arb-mainnet",
    [arbitrumSepolia.id]: "arb-sepolia",
    [base.id]: "base-mainnet",
    [baseSepolia.id]: "base-sepolia",
    [solana.id]: "solana-mainnet",
} as const;

/**
 * Constructs an RPC URL for the given chain ID
 * @param chainId - The chain ID to get the RPC URL for
 * @returns The RPC URL for the specified chain
 * @throws Error if the chain ID is not supported
 */
export function getAlchemyRpcUrl(chainId: number): string {
    // Get the Alchemy subdomain for this chain
    const subdomain = ALCHEMY_SUBDOMAINS[chainId as keyof typeof ALCHEMY_SUBDOMAINS];

    if (!subdomain) {
        throw new Error(
            `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(ALCHEMY_SUBDOMAINS).join(", ")}`,
        );
    }

    return `https://${subdomain}.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`;
}

/** Get the Bot Server URL for the given chain ID */
export function getBotServerUrl(chainId: number) {
    if (!isSupportedChainId(chainId)) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
    const hostname = "bot-server.renegade.fi";
    const chainSpecifier = CHAIN_SPECIFIERS[chainId];
    return `https://${chainSpecifier}.${hostname}`;
}

/** Get the Bot Server API key for the given chain ID */
export function getBotServerApiKey(chainId: number) {
    if ([arbitrum.id, arbitrumSepolia.id].includes(chainId as any)) {
        return env.ARBITRUM_BOT_SERVER_API_KEY;
    }
    if ([base.id, baseSepolia.id].includes(chainId as any)) {
        return env.BASE_BOT_SERVER_API_KEY;
    }
    throw new Error(`Unsupported chain ID: ${chainId}`);
}

// Helper function to manually encode function data to read balance of token
export async function readErc20BalanceOf(
    rpcUrl: string,
    mint: `0x${string}`,
    owner: `0x${string}`,
): Promise<bigint> {
    try {
        const data = encodeFunctionData({
            abi,
            args: [owner],
            functionName: "balanceOf",
        });

        const response = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "eth_call",
                params: [{ data, to: mint }, "latest"],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        const result = await response.json();
        return BigInt(result.result);
    } catch (error) {
        console.error("Error fetching balance", {
            error,
            mint,
            owner,
            rpcUrl,
        });
        return BigInt(0);
    }
}

export async function readEthBalance(rpcUrl: string, address: string): Promise<bigint> {
    try {
        const response = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "eth_getBalance",
                params: [address, "latest"],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        const result = await response.json();
        return BigInt(result.result);
    } catch (error) {
        console.error("Error reading ETH balance", {
            address,
            error,
            rpcUrl,
        });
        return BigInt(0);
    }
}

export async function readSplBalanceOf(
    rpcUrl: string,
    tokenAddress: string,
    userAddress: string,
): Promise<bigint> {
    try {
        const accountResponse = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "getTokenAccountsByOwner",
                params: [userAddress, { mint: tokenAddress }, { encoding: "jsonParsed" }],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        const accountData = await accountResponse.json();
        if (!accountData.result?.value?.length) {
            return BigInt(0);
        }

        const tokenAccountAddress = accountData.result.value[0].pubkey;
        const balanceResponse = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "getTokenAccountBalance",
                params: [tokenAccountAddress],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        const balanceData = await balanceResponse.json();
        return BigInt(balanceData.result?.value?.amount || "0");
    } catch (error) {
        console.error("Error reading SPL token balance:", error);
        return BigInt(0);
    }
}

// Bypassing viem readContract because it returns inconsistent data, maybe due to caching
export async function fetchTvl(
    mint: `0x${string}`,
    rpcUrl: string,
    darkpoolContract: `0x${string}`,
): Promise<bigint> {
    const data = encodeFunctionData({
        abi,
        args: [darkpoolContract],
        functionName: "balanceOf",
    });
    const response = await fetch(rpcUrl, {
        body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{ data, to: mint }, "latest"],
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
        throw new Error(`RPC error: ${result.error.message}`);
    }

    return BigInt(result.result);
}
