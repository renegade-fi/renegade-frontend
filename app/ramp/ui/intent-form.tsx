"use client";

import { Token } from "@renegade-fi/token-nextjs";
import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useChains } from "wagmi";
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
import { Switch } from "@/components/ui/switch";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { getSwapInputsFor, getTokenByTicker } from "../token-registry";
import { useControllerContext } from "../transaction-control/controller-context";
import type { SequenceIntent } from "../types";

const DEFAULT_USER_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

function uniqueSortedTickers(): string[] {
    // Collect tickers from token registry for dropdown.
    // This keeps the demo dynamic without hard-coding.
    const tickers = new Set<string>();
    (Token.getAllTokens() as any[]).forEach((t) => tickers.add(t.ticker));
    return Array.from(tickers).sort();
}

export function IntentForm() {
    const { controller } = useControllerContext();

    // Form state
    type Operation = "DEPOSIT" | "WITHDRAW";

    const [operation, setOperation] = useState<Operation>("DEPOSIT");
    const [operationToken, setOperationToken] = useState<string>("USDC");
    const [sourceToken, setSourceToken] = useState<string>("USDC.e");
    const [amount, setAmount] = useState<string>("1");
    const [isPureDeposit, setIsPureDeposit] = useState<boolean>(false);
    const currentChain = useCurrentChain();

    // Wagmi chains for selector options
    const chains = useChains();

    // Operation chain - where the deposit/withdraw should occur
    const [operationChain, setOperationChain] = useState<number>(currentChain ?? 1);

    // Token chain - where the source token is coming from
    const [tokenChain, setTokenChain] = useState<number>(currentChain ?? 1);

    const tickers = useMemo(() => uniqueSortedTickers(), []);

    // Source token options based on operation token's swap inputs
    // Includes self token
    const sourceTokenOptions = useMemo(() => {
        const operationTokenObj = getTokenByTicker(operationToken, operationChain);
        if (operationTokenObj) {
            const swapInputs = getSwapInputsFor(operationTokenObj);
            if (swapInputs.length > 0) {
                return [...swapInputs.map((t) => t.ticker), operationToken];
            }
        }
        return [operationToken];
    }, [operationToken, operationChain]);

    // Ensure sourceToken stays valid as options change
    if (sourceTokenOptions.length > 0 && !sourceTokenOptions.includes(sourceToken)) {
        setSourceToken(sourceTokenOptions[0]);
    }

    function runIntent(intent: SequenceIntent) {
        controller.start(intent);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Get token metadata for parsing amount
        const sourceTokenObj = getTokenByTicker(sourceToken, tokenChain);
        if (!sourceTokenObj) {
            alert("Invalid token selected");
            return;
        }
        const decimals = sourceTokenObj.decimals;

        let atomic: bigint;
        try {
            atomic = parseUnits(amount, decimals);
        } catch (err) {
            alert("Invalid amount format");
            return;
        }

        if (operation === "WITHDRAW") {
            // Withdrawals are simple - no bridge or swap
            const intent: SequenceIntent = {
                kind: "WITHDRAW",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: operationChain,
                toChain: operationChain,
                toTicker: operationToken,
                amountAtomic: atomic,
            };
            runIntent(intent);
            return;
        }

        // Check if pure deposit is enabled
        if (isPureDeposit) {
            // Pure deposit - skip all bridge/swap logic
            const intent: SequenceIntent = {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: operationChain,
                toChain: operationChain,
                toTicker: operationToken,
                amountAtomic: atomic,
            };
            runIntent(intent);
            return;
        }

        // For DEPOSIT operations, determine what steps are needed
        const needsBridge = tokenChain !== operationChain;
        const needsSwap = sourceToken !== operationToken;

        if (needsSwap) {
            // Need to swap from source token to operation token
            const intent: SequenceIntent = {
                kind: "SWAP",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: needsBridge ? tokenChain : operationChain,
                toChain: operationChain,
                fromTicker: sourceToken,
                toTicker: operationToken,
                amountAtomic: atomic,
            };
            runIntent(intent);
            return;
        }

        if (needsBridge) {
            // Token needs to be bridged from token chain to operation chain
            const intent: SequenceIntent = {
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: tokenChain,
                toChain: operationChain,
                toTicker: operationToken,
                amountAtomic: atomic,
            };
            runIntent(intent);
            return;
        }

        // Simple deposit - token is already on the right chain and same as operation token
        const intent: SequenceIntent = {
            kind: "DEPOSIT",
            userAddress: DEFAULT_USER_ADDRESS,
            fromChain: operationChain,
            toChain: operationChain,
            toTicker: operationToken,
            amountAtomic: atomic,
        };
        runIntent(intent);
    }

    return (
        <form className="space-y-4 w-full" onSubmit={handleSubmit}>
            {/* Operation */}
            <div className="space-y-2">
                <Label htmlFor="operation-select">Operation</Label>
                <Select value={operation} onValueChange={(v) => setOperation(v as Operation)}>
                    <SelectTrigger id="operation-select" className="w-full">
                        <SelectValue placeholder="Select operation" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Pure Deposit Toggle */}
            {operation === "DEPOSIT" && (
                <div className="flex items-center space-x-2">
                    <Switch
                        id="pure-deposit"
                        checked={isPureDeposit}
                        onCheckedChange={setIsPureDeposit}
                    />
                    <Label htmlFor="pure-deposit">Pure Deposit Only (Skip Bridge/Swap)</Label>
                </div>
            )}

            {/* Operation Chain */}
            <div className="space-y-2">
                <Label htmlFor="operation-chain-select">Operation Chain</Label>
                <Select
                    value={operationChain.toString()}
                    onValueChange={(v) => setOperationChain(Number(v))}
                >
                    <SelectTrigger id="operation-chain-select" className="w-full">
                        <SelectValue placeholder="Select operation chain" />
                    </SelectTrigger>
                    <SelectContent>
                        {chains.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} ({c.id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Operation Token */}
            <div className="space-y-2">
                <Label htmlFor="operation-token-select">Operation Token</Label>
                <Select value={operationToken} onValueChange={setOperationToken}>
                    <SelectTrigger id="operation-token-select" className="w-full">
                        <SelectValue placeholder="Select operation token" />
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

            {/* Source Token */}
            <div className="space-y-2">
                <Label htmlFor="source-token-select">Source Token</Label>
                <Select value={sourceToken} onValueChange={setSourceToken}>
                    <SelectTrigger id="source-token-select" className="w-full">
                        <SelectValue placeholder="Select source token" />
                    </SelectTrigger>
                    <SelectContent>
                        {sourceTokenOptions.map((t, i) => (
                            <SelectItem key={`${t}-${i}`} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Token Chain */}
            <div className="space-y-2">
                <Label htmlFor="token-chain-select">Token Chain</Label>
                <Select
                    value={tokenChain.toString()}
                    onValueChange={(v) => setTokenChain(Number(v))}
                >
                    <SelectTrigger id="token-chain-select" className="w-full">
                        <SelectValue placeholder="Select token chain" />
                    </SelectTrigger>
                    <SelectContent>
                        {chains.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} ({c.id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
                <Label htmlFor="amount-input">Amount</Label>
                <Input
                    id="amount-input"
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            <Button type="submit" className="w-full">
                {operation === "DEPOSIT" ? "Deposit" : "Withdraw"}
            </Button>
        </form>
    );
}
