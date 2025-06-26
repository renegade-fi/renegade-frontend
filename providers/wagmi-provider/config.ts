import type { Chain } from "viem";
import { http } from "viem";
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from "viem/chains";
import { cookieStorage, createConfig, createStorage } from "wagmi";

import { env } from "@/env/client";
import { getURL } from "@/lib/utils";

import getDefaultConfig from "./defaultConfig";

export const MAINNET_CHAINS = [arbitrum, base] as const;
export const TESTNET_CHAINS = [arbitrumSepolia, baseSepolia] as const;

const chains: readonly [Chain, ...Chain[]] =
    env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet"
        ? [...MAINNET_CHAINS, mainnet]
        : [...TESTNET_CHAINS];

export function getConfig() {
    return createConfig(
        getDefaultConfig({
            chains,
            transports: {
                [arbitrum.id]: http(`/api/proxy/rpc?id=${arbitrum.id}`),
                [arbitrumSepolia.id]: http(`/api/proxy/rpc?id=${arbitrumSepolia.id}`),
                [base.id]: http(`/api/proxy/rpc?id=${base.id}`),
                [baseSepolia.id]: http(`/api/proxy/rpc?id=${baseSepolia.id}`),
                // Needed to support bridge
                [mainnet.id]: http(`/api/proxy/rpc?id=${mainnet.id}`),
            },
            ssr: true,
            storage: createStorage({
                storage: cookieStorage,
            }),

            walletConnectProjectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            coinbaseWalletPreference: "eoaOnly",

            appName: "Renegade",
            appDescription: "On-chain dark pool",
            appUrl: getURL(),
            appIcon: `${getURL()}/glyph_light.svg`,
        }),
    );
}

/** Chains available in the environment */
export const AVAILABLE_CHAINS =
    env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet" ? MAINNET_CHAINS : TESTNET_CHAINS;

declare module "wagmi" {
    interface Register {
        config: ReturnType<typeof getConfig>;
    }
}
