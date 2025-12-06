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

    // Create an injected connector for the Binance Wallet
    const binanceConnectorInjected = injected({
        target: {
            icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMEIwRTExIi8+CjxwYXRoIGQ9Ik01IDE1TDcuMjU4MDYgMTIuNzQxOUw5LjUxNjEzIDE1TDcuMjU4MDYgMTcuMjU4MUw1IDE1WiIgZmlsbD0iI0YwQjkwQiIvPgo8cGF0aCBkPSJNOC44NzA5NyAxMS4xMjlMMTUgNUwyMS4xMjkgMTEuMTI5TDE4Ljg3MSAxMy4zODcxTDE1IDkuNTE2MTNMMTEuMTI5IDEzLjM4NzFMOC44NzA5NyAxMS4xMjlaIiBmaWxsPSIjRjBCOTBCIi8+CjxwYXRoIGQ9Ik0xMi43NDE5IDE1TDE1IDEyLjc0MTlMMTcuMjU4MSAxNUwxNSAxNy4yNTgxTDEyLjc0MTkgMTVaIiBmaWxsPSIjRjBCOTBCIi8+CjxwYXRoIGQ9Ik0xMS4xMjkgMTYuNjEyOUw4Ljg3MDk3IDE4Ljg3MUwxNSAyNUwyMS4xMjkgMTguODcxTDE4Ljg3MSAxNi42MTI5TDE1IDIwLjQ4MzlMMTEuMTI5IDE2LjYxMjlaIiBmaWxsPSIjRjBCOTBCIi8+CjxwYXRoIGQ9Ik0yMC40ODM5IDE1TDIyLjc0MTkgMTIuNzQxOUwyNSAxNUwyMi43NDE5IDE3LjI1ODFMMjAuNDgzOSAxNVoiIGZpbGw9IiNGMEI5MEIiLz4KPC9zdmc+Cg==",
            id: "wallet.binance.com",
            name: "Binance Wallet Injected",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            provider: () => (window as any)?.binancew3w?.ethereum,
        },
    });
    // HACK: Prevent ConnectKit from sorting the Binance Wallet connector to the
    // top of the selection list. Setting a type of "mock" makes ConnectKit
    // think that Binance is not explicitly "injected" yet still "installed"
    const binanceConnector = (config: any) => ({
        ...binanceConnectorInjected(config),
        type: "mock",
    });

    // Add the rest of the connectors
    connectors.push(
        injected({ target: "metaMask" }),
        coinbaseWallet({
            appLogoUrl: app.icon,
            appName: app.name,
            overrideIsMetaMask: false,
            preference: coinbaseWalletPreference,
        }),
        binanceConnector,
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
