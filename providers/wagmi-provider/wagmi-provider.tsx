"use client";

import { createConfig as createLifiConfig, EVM } from "@lifi/sdk";
import { isSupportedChainId } from "@renegade-fi/react";
import { type ChainId, ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants";
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
    disableVersionCheck: true,
    integrator: "renegade.fi",
    // We disable chain preloading and will update chain configuration in runtime
    preloadChains: false,
    providers: [EVM()],
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
        <Provider config={config} initialState={initialState} reconnectOnMount>
            <QueryProvider>
                <ConnectKitProvider
                    customTheme={connectKitTheme}
                    onConnect={() => {
                        sidebarEvents.emit("open");
                        setOpen(true);
                    }}
                    options={{
                        hideQuestionMarkCTA: true,
                        hideTooltips: true,
                        initialChainId: currentChainId,
                    }}
                    theme="midnight"
                >
                    {children}
                    <WagmiDebug />
                    <SyncRenegadeWagmiState />
                    <SignInDialog onOpenChange={setOpen} open={open} />
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
        if (account.status !== "connected") return;
        if (isMutatingChain) return;
        if (wagmiChainId === currentChainId) return;
        if (!isSupportedChainId(wagmiChainId)) return;
        setChainId(wagmiChainId);
    }, [account.status, currentChainId, isMutatingChain, setChainId, wagmiChainId]);

    // Verify cached wallet signatures still match the connected EOA.
    React.useEffect(() => {
        (async () => {
            const address = account.address;
            if (!address) {
                // No EOA connected; clear cached wallets to avoid stale state
                resetAllWallets();
                return;
            }

            for (const [chainId, wallet] of wallets) {
                if (!wallet.seed) continue;
                const message = `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`;
                const signature = wallet.seed;

                try {
                    const valid = await verifyMessage({ address, message, signature });
                    if (!valid) {
                        console.warn("[wallet] invalid signature; resetting wallet", { chainId });
                        resetWallet(chainId as ChainId);
                    }
                } catch (err) {
                    console.warn("[wallet] signature verification error; resetting wallet", {
                        chainId,
                        err,
                    });
                    resetWallet(chainId as ChainId);
                }
            }
        })();
    }, [account.address, resetAllWallets, resetWallet, wallets]);

    return null;
}

/**
 * Temporary debug tracer for wagmi/provider/window events to diagnose spurious disconnects.
 */
function WagmiDebug() {
    const { address, connector, status } = useAccount();
    const chainId = useChainId();
    const isSwitching = !!useIsMutating({ mutationKey: ["switchChain"] });

    // Account/chain snapshots
    React.useEffect(() => {
        console.log("[wagmi] account change", {
            address,
            chainId,
            connector: connector?.name,
            isSwitching,
            status,
            ts: Date.now(),
        });
    }, [status, address, connector, chainId, isSwitching]);

    // EIP-1193 provider-level events
    React.useEffect(() => {
        let provider: any | undefined;
        let off: (() => void) | undefined;

        (async () => {
            if (!connector) return;
            provider = await (connector as any).getProvider?.();
            if (!provider?.on) return;

            const onAccounts = (a: any) => console.log("[provider] accountsChanged", a);
            const onChain = (c: any) => console.log("[provider] chainChanged", c);
            const onDisconnect = (e: any) => console.log("[provider] disconnect", e);

            provider.on("accountsChanged", onAccounts);
            provider.on("chainChanged", onChain);
            provider.on("disconnect", onDisconnect);

            off = () => {
                provider?.removeListener?.("accountsChanged", onAccounts);
                provider?.removeListener?.("chainChanged", onChain);
                provider?.removeListener?.("disconnect", onDisconnect);
            };
        })();

        return () => off?.();
    }, [connector]);

    // Window focus/visibility correlation
    React.useEffect(() => {
        const onFocus = () => console.log("[window] focus", { ts: Date.now() });
        const onBlur = () => console.log("[window] blur", { ts: Date.now() });
        const onVis = () =>
            console.log("[window] visibilitychange", (document as any).visibilityState);
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);
        document.addEventListener("visibilitychange", onVis);
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    // Snapshot wagmi cookie once on mount (noisy otherwise)
    React.useEffect(() => {
        const cookie = document.cookie.split("; ").find((x) => x.startsWith("wagmi.store="));
        if (cookie) console.log("[wagmi] cookie snapshot", decodeURIComponent(cookie));
    }, []);

    return null;
}
