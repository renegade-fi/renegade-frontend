import { defineChain, extractChain } from "viem";
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from "viem/chains";

import { env } from "@/env/client";

export const isTestnet = env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "testnet";

export const solana = defineChain({
    id: 1151111081099710,
    name: "Solana",
    nativeCurrency: {
        name: "Solana",
        symbol: "SOL",
        decimals: 9,
    },
    rpcUrls: {
        default: {
            http: ["https://api.mainnet-beta.solana.com"],
        },
    },
    blockExplorers: {
        default: {
            name: "Solana Explorer",
            url: "https://solscan.io",
        },
    },
});

type SupportedChainId =
    | typeof mainnet.id
    | typeof arbitrum.id
    | typeof arbitrumSepolia.id
    | typeof base.id
    | typeof baseSepolia.id
    | typeof solana.id;

const supportedChains = [mainnet, arbitrum, arbitrumSepolia, base, baseSepolia, solana] as const;

export function extractSupportedChain(chainId: number) {
    return extractChain({
        chains: supportedChains,
        id: chainId as SupportedChainId,
    });
}

export function getFormattedChainName(chainId: number): string {
    const _chain = extractSupportedChain(chainId);
    switch (_chain.id) {
        case mainnet.id:
            return "Ethereum";
        case arbitrum.id:
        case arbitrumSepolia.id:
            return "Arbitrum";
        case base.id:
        case baseSepolia.id:
            return "Base";
        case solana.id:
            return "Solana";
    }
}

export function getChainLogoTicker(chainId: number): string {
    const _chain = extractSupportedChain(chainId);
    switch (_chain.id) {
        case mainnet.id:
        case base.id:
        case baseSepolia.id:
            return "WETH";
        case arbitrum.id:
        case arbitrumSepolia.id:
            return "ARB";
        case solana.id:
            return "SOL";
    }
}

/** Get the deploy block for a given chain */
export function getDeployBlock(chainId: number) {
    switch (chainId) {
        case arbitrum.id:
        case arbitrumSepolia.id:
            return env.NEXT_PUBLIC_ARBITRUM_DEPLOY_BLOCK;
        case base.id:
        case baseSepolia.id:
            return env.NEXT_PUBLIC_BASE_DEPLOY_BLOCK;
        default:
            return BigInt(0);
    }
}
