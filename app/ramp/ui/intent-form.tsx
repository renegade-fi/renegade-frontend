"use client";

import { useMemo } from "react";
import { parseUnits } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { Button } from "@/components/ui/button";
import { zeroAddress } from "@/lib/token";
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
function buildPresetIntents(): Array<{ label: string; intent: SequenceIntent }> {
    // Deposit 1 USDC on Arbitrum
    const usdcDecimals = getTokenByTicker("USDC", arbitrum.id)?.decimals ?? 6;
    const usdtDecimals = getTokenByTicker("USDT", mainnet.id)?.decimals ?? 6;

    // Withdraw 0.001 WETH on Arbitrum
    const wethDecimals = getTokenByTicker("WETH", arbitrum.id)?.decimals ?? 18;

    return [
        {
            label: "Deposit 1 USDT from Mainnet to Arbitrum",
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: arbitrum.id,
                fromTicker: "USDT",
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdtDecimals),
            },
        },
        {
            label: "Deposit 1 USDT from Mainnet to Base",
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: base.id,
                fromTicker: "USDT",
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdtDecimals),
            },
        },
        {
            label: "Deposit 1 USDC on Arbitrum",
            intent: {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: arbitrum.id,
                toChain: arbitrum.id,
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdcDecimals),
            },
        },
        {
            label: "Withdraw 0.001 WETH on Arbitrum",
            intent: {
                kind: "WITHDRAW",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: arbitrum.id,
                toChain: arbitrum.id,
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

    const presets = useMemo(buildPresetIntents, []);

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
