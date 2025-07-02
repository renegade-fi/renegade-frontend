"use client";

import { useMemo } from "react";
import { parseUnits } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { Button } from "@/components/ui/button";
import { zeroAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { getTokenByTicker } from "../token-registry";
import { useControllerContext } from "../transaction-control/controller-context";
import type { SequenceIntent } from "../types";

/**
 * Hard-coded testing address – replace with real wallet address when needed.
 */
const DEFAULT_USER_ADDRESS = zeroAddress as `0x${string}`;

/**
 * Build a list of predefined SequenceIntents for quick testing.
 */
function buildPresetIntents(toChainId: number): Array<{ label: string; intent: SequenceIntent }> {
    // Resolve human-readable chain name for labels.
    const chainNames: Record<number, string> = {
        [arbitrum.id]: "Arbitrum",
        [base.id]: "Base",
        [mainnet.id]: "Mainnet",
    };

    const chainName = chainNames[toChainId] ?? `Chain ${toChainId}`;

    // Token decimal look-ups for the destination chain.
    const usdcDecimals = getTokenByTicker("USDC", toChainId)?.decimals ?? 6;
    const usdtDecimals = getTokenByTicker("USDT", toChainId)?.decimals ?? 6;
    const wethDecimals = getTokenByTicker("WETH", toChainId)?.decimals ?? 18;

    return [
        {
            label: `Deposit 1.1 USDC from Mainnet to ${chainName}`,
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: toChainId,
                fromTicker: "USDC",
                toTicker: "USDC",
                amountAtomic: parseUnits("1.1", usdcDecimals),
            },
        },
        {
            label: `Deposit 1 USDT from Mainnet to ${chainName}`,
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: toChainId,
                fromTicker: "USDT",
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdtDecimals),
            },
        },
        {
            label: `Deposit 1 USDC on ${chainName}`,
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdcDecimals),
            },
        },
        {
            label: `Withdraw 0.001 WETH on ${chainName}`,
            intent: {
                kind: "WITHDRAW",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                toTicker: "WETH",
                amountAtomic: parseUnits("0.001", wethDecimals),
            },
        },
    ];
}

/**
 * IntentForm – now a collection of one-click buttons for each preset intent.
 */
export function IntentForm() {
    const { controller } = useControllerContext();
    const chainId = useCurrentChain();

    const presets = useMemo(() => buildPresetIntents(chainId), [chainId]);

    return (
        <div className="space-y-3 w-full">
            {presets.map(({ label, intent }) => (
                <Button key={label} className="w-full" onClick={() => controller.start(intent)}>
                    {label}
                </Button>
            ))}
        </div>
    );
}
