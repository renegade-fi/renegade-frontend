import { http } from "viem";
import { arbitrum, arbitrumSepolia, base, baseSepolia, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import { getAlchemyRpcUrl } from "@/app/api/utils";

/**
 * Get wagmi config for server-side usage
 * This creates a minimal config with just the transports needed for reading contracts
 */
export function getServerWagmiConfig() {
    const chains = [arbitrum, base, mainnet, arbitrumSepolia, baseSepolia] as const;

    return createConfig({
        chains,
        transports: {
            [arbitrum.id]: http(getAlchemyRpcUrl(arbitrum.id)),
            [arbitrumSepolia.id]: http(getAlchemyRpcUrl(arbitrumSepolia.id)),
            [base.id]: http(getAlchemyRpcUrl(base.id)),
            [baseSepolia.id]: http(getAlchemyRpcUrl(baseSepolia.id)),
            [mainnet.id]: http(getAlchemyRpcUrl(mainnet.id)),
        },
    });
}
