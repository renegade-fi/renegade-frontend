import { useWallet } from "@solana/wallet-adapter-react";
import React from "react";
import { useAccount, useEnsName } from "wagmi";

import { truncateAddress } from "@/lib/format";
import { useCurrentWallet } from "@/providers/state-provider/hooks";
import { mainnetConfig } from "@/providers/wagmi-provider/config";

import { useChain } from "./use-chain";

export interface ConnectedWallet {
    name: string;
    icon: string;
    id: string;
    label: string;
    isConnected: true;
}

export interface DisconnectedWallet {
    name: string;
    icon: string | null;
    id: null;
    label: string;
    isConnected: false;
}

export type Wallet = ConnectedWallet | DisconnectedWallet;

export enum WalletReadyState {
    READY,
    CONNECTING,
    NOT_READY,
}

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
                  name: "Renegade Wallet",
                  icon: "/glyph_light.png",
                  id,
                  label: truncateAddress(id),
                  isConnected: true,
              }
            : {
                  name: "Renegade Wallet ID",
                  icon: "/glyph_light.png",
                  id: null,
                  label: "Not Connected",
                  isConnected: false,
              };

    const arbitrumWallet: Wallet =
        address && connector
            ? {
                  name: `${chainSpecifier} Wallet`,
                  icon: `/${chainSpecifier}.svg`,
                  id: address,
                  label: ensName || truncateAddress(address),
                  isConnected: true,
              }
            : {
                  name: `${chainSpecifier} Wallet`,
                  icon: `/${chainSpecifier}.svg`,
                  id: null,
                  label: "Not Connected",
                  isConnected: false,
              };
    const solanaWallet: Wallet =
        connected && publicKey && wallet
            ? {
                  name: "Solana Address",
                  icon: wallet.adapter.icon ?? "",
                  id: publicKey.toString(),
                  label: truncateAddress(publicKey.toString()),
                  isConnected: true,
              }
            : {
                  name: "Solana Address",
                  icon: null,
                  id: null,
                  label: "Not Connected",
                  isConnected: false,
              };

    // More specifically, wallet ready state on page load (may update after hydration)
    const walletReadyState = React.useMemo((): "READY" | "CONNECTING" | "NOT_READY" => {
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
        renegadeWallet,
        arbitrumWallet,
        solanaWallet,
        walletReadyState,
    } as const;
}
