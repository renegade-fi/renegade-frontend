import { defineChain, extractChain } from "viem";
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from "viem/chains";

import { env } from "@/env/client";

export const isTestnet = env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "testnet";

export const solana = defineChain({
    blockExplorers: {
        default: {
            name: "Solana Explorer",
            url: "https://solscan.io",
        },
    },
    id: 1151111081099710,
    name: "Solana",
    nativeCurrency: {
        decimals: 9,
        name: "Solana",
        symbol: "SOL",
    },
    rpcUrls: {
        default: {
            http: ["https://api.mainnet-beta.solana.com"],
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

/** Get the explorer link for a given transaction hash and chain ID */
export function getExplorerLink(txHash: string, chainId?: number) {
    if (!chainId) {
        return;
    }
    const _chain = extractSupportedChain(chainId);

    const explorerUrl = _chain.blockExplorers?.default.url;
    if (!explorerUrl) {
        throw new Error(`No block explorer URL found for chain ${_chain.name}`);
    }
    return `${explorerUrl}/tx/${txHash}`;
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

/** Get the logo for a given chain */
export function getChainLogo(chainId: number): string {
    const _chain = extractSupportedChain(chainId);
    switch (_chain.id) {
        case mainnet.id:
            return "/mainnet.svg";
        case arbitrum.id:
        case arbitrumSepolia.id:
            return "/arbitrum.svg";
        case base.id:
        case baseSepolia.id:
            return "/base.svg";
        case solana.id:
            return "/solana.svg";
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
