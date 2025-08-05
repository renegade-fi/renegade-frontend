"use client";

import { createConfig as createLifiConfig, EVM } from "@lifi/sdk";
import { isSupportedChainId } from "@renegade-fi/react";
import { type ChainId, ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
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

    const queryClient = useQueryClient();

    React.useEffect(() => {
        const getPendingMutationKeys = () => {
            const mutationCache = queryClient.getMutationCache();
            const allMutations = mutationCache.getAll();
            const pendingMutations = allMutations
                .filter((mutation) => mutation.state.status === "pending")
                .map((mutation) => mutation.options.mutationKey)
                .filter((key) => key !== undefined);
            return pendingMutations;
        };

        // Log effect trigger to help with Hypothesis 3 (frequent re-runs)
        console.log("SyncRenegadeWagmiState effect triggered", {
            currentChainId,
            hasAddress: !!account.address,
            timestamp: Date.now(),
            wagmiChainId,
            walletsCount: wallets.size,
        });

        function logAndReset(chainId: ChainId | undefined, reason: string, details?: any) {
            const pendingMutationKeys = getPendingMutationKeys();
            console.log("=== WALLET RESET TRIGGERED ===");
            console.log("Reason:", reason);
            console.log("ChainId:", chainId);
            console.log("Account address:", account.address);
            console.log("Wallets count:", wallets.size);
            console.log("Pending mutation keys:", pendingMutationKeys);
            console.log("Current wagmi chain:", wagmiChainId);
            console.log("Current app chain:", currentChainId);
            console.log("Additional details:", details);
            console.log(
                "Wallets state:",
                Array.from(wallets.entries()).map(([id, wallet]) => ({
                    chainId: id,
                    hasSeed: !!wallet.seed,
                    seedLength: wallet.seed?.length || 0,
                })),
            );
            console.log("=== END WALLET RESET ===");

            if (chainId) {
                resetWallet(chainId);
            } else {
                resetAllWallets();
            }
        }

        // async function verifyWallets() {
        //     const address = account.address;
        //     if (!address) {
        //         logAndReset(undefined, "No account address");
        //         return;
        //     }

        //     for (const [chainId, wallet] of wallets) {
        //         if (!wallet.seed) continue;
        //         const message = `${ROOT_KEY_MESSAGE_PREFIX} ${chainId}`;
        //         const signature = wallet.seed;

        //         console.log(`Verifying wallet for chain ${chainId}`, {
        //             hasAddress: !!address,
        //             hasSeed: !!wallet.seed,
        //             message,
        //             signatureLength: signature?.length || 0,
        //         });

        //         const valid = await verifyMessage({
        //             address,
        //             message,
        //             signature,
        //         });

        //         console.log(`Verification result for chain ${chainId}:`, valid);

        //         if (!valid) {
        //             logAndReset(chainId, "Invalid signature", { message, signature });
        //         }
        //     }
        // }
        // verifyWallets();
    }, [
        account.address,
        currentChainId,
        queryClient.getMutationCache,
        resetAllWallets,
        resetWallet,
        wagmiChainId,
        wallets.entries,
        wallets.size,
    ]);

    return null;
}
