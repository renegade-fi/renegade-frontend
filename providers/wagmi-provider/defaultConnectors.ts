// Copied from https://github.com/family/connectkit/blob/9a3c16c781d8a60853eff0c4988e22926a3f91ce/packages/connectkit/src/defaultConnectors.ts
// to bypass connectkit issue regarding SSR
import { type CreateConnectorFn, injected } from "wagmi";
import {
    type CoinbaseWalletParameters,
    coinbaseWallet,
    safe,
    walletConnect,
} from "wagmi/connectors";

type DefaultConnectorsProps = {
    app: {
        name: string;
        icon?: string;
        description?: string;
        url?: string;
    };
    walletConnectProjectId?: string;
    coinbaseWalletPreference?: CoinbaseWalletParameters<"4">["preference"];
};

const defaultConnectors = ({
    app,
    walletConnectProjectId,
    coinbaseWalletPreference,
}: DefaultConnectorsProps): CreateConnectorFn[] => {
    const hasAllAppData = app.name && app.icon && app.description && app.url;
    const shouldUseSafeConnector = !(typeof window === "undefined") && window?.parent !== window;

    const connectors: CreateConnectorFn[] = [];

    // If we're in an iframe, include the SafeConnector
    if (shouldUseSafeConnector) {
        connectors.push(
            safe({
                allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/],
            }),
        );
    }

    // Add the rest of the connectors
    connectors.push(
        injected({ shimDisconnect: true, target: "metaMask" }),
        coinbaseWallet({
            appLogoUrl: app.icon,
            appName: app.name,
            overrideIsMetaMask: false,
            preference: coinbaseWalletPreference,
        }),
    );

    if (walletConnectProjectId) {
        connectors.push(
            walletConnect({
                metadata: hasAllAppData
                    ? {
                          description: app.description!,
                          icons: [app.icon!],
                          name: app.name,
                          url: app.url!,
                      }
                    : undefined,
                projectId: walletConnectProjectId,
                showQrModal: false,
            }),
        );
    }
    /*
  connectors.push(
    injected({
      shimDisconnect: true,
    })
  );
  */

    return connectors;
};

export default defaultConnectors;
