// Copied from https://github.com/family/connectkit/blob/9a3c16c781d8a60853eff0c4988e22926a3f91ce/packages/connectkit/src/defaultConfig.ts
// to bypass connectkit issue regarding SSR
import { type CreateConfigParameters, http } from "wagmi";
import { arbitrum, mainnet } from "wagmi/chains";
import type { CoinbaseWalletParameters } from "wagmi/connectors";

import defaultConnectors from "./defaultConnectors";

// TODO: Move these to a provider rather than global variable
let globalAppName: string;
let globalAppIcon: string;
export const getAppName = () => globalAppName;
export const getAppIcon = () => globalAppIcon;

type DefaultConfigProps = {
    appName: string;
    appIcon?: string;
    appDescription?: string;
    appUrl?: string;

    // WC 2.0 requires a project ID (get one here: https://cloud.walletconnect.com/sign-in)
    walletConnectProjectId: string;
    // Coinbase Wallet preference
    coinbaseWalletPreference?: CoinbaseWalletParameters<"4">["preference"];
} & Partial<CreateConfigParameters>;

const defaultConfig = ({
    appName = "ConnectKit",
    appIcon,
    appDescription,
    appUrl,
    walletConnectProjectId,
    coinbaseWalletPreference,
    chains = [mainnet, arbitrum],
    client,
    ...props
}: DefaultConfigProps): CreateConfigParameters => {
    globalAppName = appName;
    if (appIcon) globalAppIcon = appIcon;

    // TODO: nice to have, automate transports based on chains, but for now just provide public if not provided
    const transports: CreateConfigParameters["transports"] =
        props?.transports ?? Object.fromEntries(chains.map((chain) => [chain.id, http()]));

    const connectors: CreateConfigParameters["connectors"] =
        props?.connectors ??
        defaultConnectors({
            app: {
                name: appName,
                icon: appIcon,
                description: appDescription,
                url: appUrl,
            },
            walletConnectProjectId,
            coinbaseWalletPreference,
        });

    const config: CreateConfigParameters<any, any> = {
        ...props,
        chains,
        connectors,
        transports,
    };

    return config;
};

export default defaultConfig;
