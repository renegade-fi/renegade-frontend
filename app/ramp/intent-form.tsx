"use client";

import { Token } from "@renegade-fi/token-nextjs";
import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    type Action = "DEPOSIT" | "WITHDRAW" | "BRIDGE" | "SWAP";

    const [action, setAction] = useState<Action>("SWAP");
    const [toTicker, setToTicker] = useState<string>("USDC");
    const [fromTicker, setFromTicker] = useState<string>("USDC.e");
    const [amount, setAmount] = useState<string>("1");
    const currentChain = useCurrentChain();
    const [toChain, setToChain] = useState<string>(currentChain?.toString() ?? "1");

    const tickers = useMemo(() => uniqueSortedTickers(), []);

    // Whitelisted input tokens for the selected "to" token when swapping
    const swapFromOptions = useMemo(() => {
        if (action !== "SWAP") return [];
        const chainId = currentChain ?? 1;
        try {
            const meta = getTokenMeta(toTicker, chainId);
            if (meta.swapFrom && meta.swapFrom.length > 0) {
                return meta.swapFrom;
            }
        } catch {
            // ignore errors – fall back to full list
        }
        return tickers;
    }, [action, toTicker, currentChain, tickers]);

    // Ensure fromTicker stays valid as options change
    if (action === "SWAP" && swapFromOptions.length > 0 && !swapFromOptions.includes(fromTicker)) {
        setFromTicker(swapFromOptions[0]);
    }

    function runIntent(intent: SequenceIntent) {
        controller.start(intent);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const fromChain = currentChain ?? 1;

        if (action === "SWAP") {
            // Determine decimals based on from token (input)
            const fromMeta = getTokenMeta(fromTicker, fromChain);
            const fromDecimals = fromMeta.decimals;

            let atomicSwap: bigint;
            try {
                atomicSwap = parseUnits(amount, fromDecimals);
            } catch (err) {
                alert("Invalid amount format");
                return;
            }

            const intent: SequenceIntent = {
                kind: "SWAP",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain,
                toChain: Number(toChain),
                fromTicker,
                toTicker,
                amountAtomic: atomicSwap,
            };
            runIntent(intent);
            return;
        }

        // Resolve token metadata & decimals on-demand
        const tokenMeta = getTokenMeta(toTicker, fromChain);
        const decimals = Token.fromAddressOnChain(tokenMeta.address, fromChain).decimals;

        let atomic: bigint;
        try {
            atomic = parseUnits(amount, decimals);
        } catch (err) {
            alert("Invalid amount format");
            return;
        }

        const intent: SequenceIntent = {
            kind: action === "WITHDRAW" ? "WITHDRAW" : "DEPOSIT",
            userAddress: DEFAULT_USER_ADDRESS,
            fromChain,
            toChain: action === "BRIDGE" ? Number(toChain) : fromChain,
            toTicker,
            amountAtomic: atomic,
        };
        runIntent(intent);
    }

    return (
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
            {/* Action */}
            <div className="space-y-2">
                <Label htmlFor="intent-action-select">Action</Label>
                <Select value={action} onValueChange={(v) => setAction(v as Action)}>
                    <SelectTrigger id="intent-action-select" className="w-full">
                        <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                        <SelectItem value="BRIDGE">Cross-Chain Deposit</SelectItem>
                        <SelectItem value="SWAP">Swap</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Token (for swap this is the target token) */}
            <div className="space-y-2">
                <Label htmlFor="intent-token-select">
                    {action === "SWAP" ? "To Token" : "Token"}
                </Label>
                <Select value={toTicker} onValueChange={setToTicker}>
                    <SelectTrigger id="intent-token-select" className="w-full">
                        <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                        {tickers.map((t, i) => (
                            <SelectItem key={`${t}-${i}`} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* From token selector (Swap only) */}
            {action === "SWAP" && (
                <div className="space-y-2">
                    <Label htmlFor="intent-from-token-select">From Token</Label>
                    <Select value={fromTicker} onValueChange={setFromTicker}>
                        <SelectTrigger id="intent-from-token-select" className="w-full">
                            <SelectValue placeholder="Select source token" />
                        </SelectTrigger>
                        <SelectContent>
                            {swapFromOptions.map((t, i) => (
                                <SelectItem key={`${t}-${i}`} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
                <Label htmlFor="intent-amount-input">Amount</Label>
                <Input
                    id="intent-amount-input"
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            {/* Destination chain (Bridge only) */}
            {action === "BRIDGE" && (
                <div className="space-y-2">
                    <Label htmlFor="intent-to-chain-input">Destination Chain ID</Label>
                    <Input
                        id="intent-to-chain-input"
                        type="number"
                        value={toChain}
                        onChange={(e) => setToChain(e.target.value)}
                    />
                </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={
                    action === "SWAP" && (swapFromOptions.length === 0 || fromTicker === toTicker)
                }
            >
                Run
            </Button>
        </form>
    );
}
