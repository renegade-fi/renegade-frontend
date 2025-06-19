"use client";

import React from "react";

import { useAccount, usePublicClient } from "wagmi";

import { useIsBase } from "@/hooks/use-is-base";
import { fundList, fundWallet } from "@/lib/utils";
import { isTestnet } from "@/lib/viem";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function Faucet() {
    const { address } = useAccount();
    const chainId = useCurrentChain();
    const publicClient = usePublicClient();
    const isBase = useIsBase();
    // Fund on wallet change
    React.useEffect(() => {
        const handleFund = async () => {
            if (!address || !isTestnet || isBase) return;
            const balance = await publicClient?.getBalance({
                address,
            });
            if (!balance) {
                fundWallet(fundList, address, chainId);
            }
        };
        handleFund();
    }, [address, chainId, publicClient, isBase]);
    return null;
}
