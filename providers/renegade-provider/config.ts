import { createConfig, getSDKConfig } from "@renegade-fi/react";
import type { ChainId } from "@renegade-fi/react/constants";
import { noopStorage } from "wagmi";
import { createJSONStorage } from "zustand/middleware";

export const getConfigFromChainId = (chainId: ChainId) => {
    const sdkConfig = getSDKConfig(chainId);
    return createConfig({
        chainId,
        darkPoolAddress: sdkConfig.darkpoolAddress,
        priceReporterUrl: sdkConfig.priceReporterUrl,
        relayerUrl: sdkConfig.relayerUrl,
        storage: createJSONStorage(() => noopStorage) as any,
    });
};
