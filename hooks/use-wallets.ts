import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { useAccount, useEnsName } from "wagmi";

import { truncateAddress } from "@/lib/format";
import { useCurrentWallet } from "@/providers/state-provider/hooks";
import { mainnetConfig } from "@/providers/wagmi-provider/config";

import { useChain } from "./use-chain";

interface ConnectedWallet {
    name: string;
    icon: string;
    id: string;
    label: string;
    isConnected: true;
}

interface DisconnectedWallet {
    name: string;
    icon: string | null;
    id: null;
    label: string;
    isConnected: false;
}

export type Wallet = ConnectedWallet | DisconnectedWallet;

const WalletReadyState = {
    CONNECTING: "CONNECTING",
    NOT_READY: "NOT_READY",
    READY: "READY",
} as const;

type WalletReadyState = (typeof WalletReadyState)[keyof typeof WalletReadyState];

export function useWallets() {
    // Wagmi
    // Using address && connector because initialState loads these from cookies
    // status is "reconnecting" usually, so avoid usign it on page load
    const { address, connector, status } = useAccount();
    const currentChain = useChain();
    const { publicKey, wallet, connected } = useWallet();
    const { data: ensName } = useEnsName({
        address,
        config: mainnetConfig,
    });
    const chainSpecifier = currentChain?.name.split(" ")[0].toLowerCase();

    // Renegade
    // Using seed && wallet ID because initialState loads these from cookies
    const { seed, id } = useCurrentWallet();
    const renegadeWallet: Wallet =
        seed && id
            ? {
                  icon: "/glyph_light.png",
                  id,
                  isConnected: true,
                  label: truncateAddress(id),
                  name: "Renegade Wallet",
              }
            : {
                  icon: "/glyph_light.png",
                  id: null,
                  isConnected: false,
                  label: "Not Connected",
                  name: "Renegade Wallet ID",
              };

    const arbitrumWallet: Wallet =
        address && connector
            ? {
                  icon: `/${chainSpecifier}.svg`,
                  id: address,
                  isConnected: true,
                  label: ensName || truncateAddress(address),
                  name: `${chainSpecifier} Wallet`,
              }
            : {
                  icon: `/${chainSpecifier}.svg`,
                  id: null,
                  isConnected: false,
                  label: "Not Connected",
                  name: `${chainSpecifier} Wallet`,
              };
    const solanaWallet: Wallet =
        connected && publicKey && wallet
            ? {
                  icon: wallet.adapter.icon ?? "",
                  id: publicKey.toString(),
                  isConnected: true,
                  label: truncateAddress(publicKey.toString()),
                  name: "Solana Address",
              }
            : {
                  icon: null,
                  id: null,
                  isConnected: false,
                  label: "Not Connected",
                  name: "Solana Address",
              };

    // More specifically, wallet ready state on page load (may update after hydration)
    const walletReadyState = React.useMemo((): WalletReadyState => {
        switch (status) {
            case "connecting":
            case "reconnecting":
                return seed && address && connector ? "READY" : "CONNECTING";

            case "connected":
                return seed && address && connector ? "READY" : "NOT_READY";
            default:
                return "NOT_READY";
        }
    }, [address, seed, connector, status]);

    return {
        arbitrumWallet,
        renegadeWallet,
        solanaWallet,
        walletReadyState,
    } as const;
}
