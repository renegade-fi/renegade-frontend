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
                    </SelectContent>
                </Select>
            </div>

            {/* Token */}
            <div className="space-y-2">
                <Label htmlFor="intent-token-select">Token</Label>
                <Select value={tokenTicker} onValueChange={setTokenTicker}>
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

            <Button type="submit" className="w-full">
                Run
            </Button>

            <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={presetDeposit}>
                    Preset Deposit
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={presetBridge}>
                    Preset Bridge
                </Button>
            </div>
        </form>
    );
}
