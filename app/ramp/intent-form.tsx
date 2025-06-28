"use client";

import { Token } from "@renegade-fi/token-nextjs";
import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { useControllerContext } from "./controller-context";
import type { SequenceIntent } from "./sequence/models";
import { getTokenMeta } from "./sequence/token-registry";

const DEFAULT_USER_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

function uniqueSortedTickers(): string[] {
    // Collect tickers from token registry for dropdown.
    // This keeps the demo dynamic without hard-coding.
    const tickers = new Set<string>();
    (Token.getAllTokens() as any[]).forEach((t) => tickers.add(t.ticker));
    // Ensure commonly-used tickers appear even if not in the dynamic list
    tickers.add("USDC");
    return Array.from(tickers).sort();
}

export function IntentForm() {
    const { controller } = useControllerContext();

    // Form state
    type Action = "DEPOSIT" | "WITHDRAW" | "BRIDGE";

    const [action, setAction] = useState<Action>("DEPOSIT");
    const [tokenTicker, setTokenTicker] = useState<string>("USDC");
    const [amount, setAmount] = useState<string>("1");
    const currentChain = useCurrentChain();
    const [toChain, setToChain] = useState<string>(currentChain?.toString() ?? "1");

    const tickers = useMemo(() => uniqueSortedTickers(), []);

    function runIntent(intent: SequenceIntent) {
        controller.start(intent);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const fromChain = currentChain ?? 1;

        // Resolve token metadata & decimals on-demand
        const tokenMeta = getTokenMeta(tokenTicker, fromChain);
        const decimals = Token.fromAddressOnChain(tokenMeta.address, fromChain).decimals;

        let atomic: bigint;
        try {
            atomic = parseUnits(amount, decimals);
        } catch (err) {
            alert("Invalid amount format");
            return;
        }
        console.log("parse: ", {
            amount,
            atomic,
            parsed: parseUnits(amount, decimals),
            decimals,
            meta: tokenMeta,
        });

        const intent: SequenceIntent = {
            kind: action === "WITHDRAW" ? "WITHDRAW" : "DEPOSIT",
            userAddress: DEFAULT_USER_ADDRESS,
            fromChain,
            toChain: action === "BRIDGE" ? Number(toChain) : fromChain,
            tokenTicker,
            amountAtomic: atomic,
        };
        runIntent(intent);
    }

    function presetDeposit() {
        runIntent({
            kind: "DEPOSIT",
            userAddress: DEFAULT_USER_ADDRESS,
            fromChain: currentChain ?? 1,
            toChain: currentChain ?? 1,
            tokenTicker: "USDC",
            amountAtomic: BigInt(1),
        });
    }

    function presetBridge() {
        // Example: bridge from current chain to Ethereum main-net
        runIntent({
            kind: "DEPOSIT",
            userAddress: DEFAULT_USER_ADDRESS,
            fromChain: currentChain ?? 1,
            toChain: 1,
            tokenTicker: "USDC",
            amountAtomic: BigInt(1),
        });
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-2 items-center">
                <label className="text-sm font-medium" htmlFor="intent-action-select">
                    Action
                </label>
                <select
                    className="border rounded px-2 py-1"
                    id="intent-action-select"
                    value={action}
                    onChange={(e) => setAction(e.target.value as Action)}
                >
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAW">Withdraw</option>
                    <option value="BRIDGE">Cross-Chain Deposit</option>
                </select>
            </div>

            <div className="flex gap-2 items-center">
                <label className="text-sm font-medium" htmlFor="intent-token-select">
                    Token
                </label>
                <select
                    className="border rounded px-2 py-1 flex-1"
                    id="intent-token-select"
                    value={tokenTicker}
                    onChange={(e) => setTokenTicker(e.target.value)}
                >
                    {tickers.map((t, i) => (
                        <option key={`${t}-${i}`} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex gap-2 items-center">
                <label className="text-sm font-medium" htmlFor="intent-amount-input">
                    Amount
                </label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    className="border rounded px-2 py-1 w-32"
                    id="intent-amount-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            {action === "BRIDGE" && (
                <div className="flex gap-2 items-center">
                    <label className="text-sm font-medium" htmlFor="intent-to-chain-input">
                        Destination&nbsp;Chain&nbsp;ID
                    </label>
                    <input
                        type="number"
                        className="border rounded px-2 py-1 w-24"
                        id="intent-to-chain-input"
                        value={toChain}
                        onChange={(e) => setToChain(e.target.value)}
                    />
                </div>
            )}

            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Run
            </button>

            <div className="flex gap-2 mt-2">
                <button
                    type="button"
                    onClick={presetDeposit}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                    Preset Deposit
                </button>
                <button
                    type="button"
                    onClick={presetBridge}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                >
                    Preset Bridge
                </button>
            </div>
        </form>
    );
}
