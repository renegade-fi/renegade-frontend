"use client";

import { createConfig as createLifiConfig, EVM } from "@lifi/sdk";
import { isSupportedChainId } from "@renegade-fi/react";
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants";
import { useIsMutating } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import React from "react";
import { verifyMessage } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { WagmiProvider as Provider, type State, useAccount, useChainId } from "wagmi";

import { SignInDialog } from "@/components/dialogs/onboarding/sign-in-dialog";

import { sidebarEvents } from "@/lib/events";
import { QueryProvider } from "@/providers/query-provider";

import { useCurrentChain } from "../state-provider/hooks";
import { useServerStore } from "../state-provider/server-store-provider";
import { getConfig } from "./config";
import { connectKitTheme } from "./theme";

createLifiConfig({
    integrator: "renegade.fi",
    providers: [EVM()],
    // We disable chain preloading and will update chain configuration in runtime
    preloadChains: false,
    disableVersionCheck: true,
    rpcUrls: {
        [arbitrum.id]: [`/api/proxy/rpc?id=${arbitrum.id}`],
        [base.id]: [`/api/proxy/rpc?id=${base.id}`],
        // Needed to support bridge
        [mainnet.id]: [`/api/proxy/rpc?id=${mainnet.id}`],
    },
});
interface WagmiProviderProps {
    children: React.ReactNode;
    initialState?: State;
}

export function WagmiProvider({ children, initialState }: WagmiProviderProps) {
    const [config] = React.useState(() => getConfig());
    const [open, setOpen] = React.useState(false);
    const currentChainId = useCurrentChain();

    return (
        <Provider reconnectOnMount config={config} initialState={initialState}>
            <QueryProvider>
                <ConnectKitProvider
                    customTheme={connectKitTheme}
                    options={{
                        hideQuestionMarkCTA: true,
                        hideTooltips: true,
                        initialChainId: currentChainId,
                    }}
                    theme="midnight"
                    onConnect={() => {
                        sidebarEvents.emit("open");
                        setOpen(true);
                    }}
                >
                    {children}
                    <SyncRenegadeWagmiState />
                    <SignInDialog open={open} onOpenChange={setOpen} />
                </ConnectKitProvider>
            </QueryProvider>
        </Provider>
    );
}

/**
 * Cookie state is the source of truth for chain and wallet data, therefore we must make sure Wagmi state stays in sync.
 *
 * We verify derived seeds against the active account. If none exists, we clear the cached state.
 */
function SyncRenegadeWagmiState() {
    const resetWallet = useServerStore((state) => state.resetWallet);
    const resetAllWallets = useServerStore((state) => state.resetAllWallets);
    const wallets = useServerStore((state) => state.wallet);
    const account = useAccount();

    const currentChainId = useCurrentChain();
    const wagmiChainId = useChainId();
    const setChainId = useServerStore((state) => state.setChainId);
    const isMutatingChain = !!useIsMutating({ mutationKey: ["switchChain"] });
    // Set current chain to wagmi chain if
    // - wagmi chain is a supported chain
    // - wagmi chain is not currently mutating
    React.useEffect(() => {
        if (isMutatingChain) return;
        if (wagmiChainId === currentChainId) return;
        if (!isSupportedChainId(wagmiChainId)) return;
        setChainId(wagmiChainId);
    }, [currentChainId, isMutatingChain, setChainId, wagmiChainId]);

    React.useEffect(() => {
        async function verifyWallets() {
            const address = account.address;
            if (!address) {
                resetAllWallets();
                return;
            }

            for (const [chainId, wallet] of wallets) {
                if (!wallet.seed) continue;
                const message = `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`;
                const signature = wallet.seed;
                const valid = await verifyMessage({
                    address,
                    message,
                    signature,
                });
                if (!valid) {
                    resetWallet(chainId);
                }
            }
        }
        // verifyWallets();
    }, [account.address, resetAllWallets, resetWallet, wallets]);

    return null;
}
