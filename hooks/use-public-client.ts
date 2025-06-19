import { createPublicClient, http } from "viem";

import { useChain } from "./use-chain";

export function usePublicClient() {
    const chain = useChain();
    return createPublicClient({
        chain,
        transport: http(),
    });
}
