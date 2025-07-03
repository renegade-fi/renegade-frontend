"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { arbitrum, base, mainnet } from "viem/chains";
import { useConfig as useWagmiConfig } from "wagmi";
import { getTokenByTicker } from "@/app/rampv2/token-registry/token-registry";
import { Button } from "@/components/ui/button";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";
import { Intent } from "./core/intent";
import { makeTaskContext } from "./core/make-task-context";
import { planTasks } from "./planner/task-planner";
import { TaskQueue } from "./queue/task-queue";

export default function RampV2Page() {
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const chainId = useCurrentChain();

    const { data: keychainNonce } = useBackOfQueueWallet({
        query: { select: (w) => w.key_chain.nonce },
    });

    // Solana hooks
    const { connection } = useConnection();
    const { signTransaction, publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    const [running, setRunning] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const addLog = (m: string) => setLog((l) => [...l, m]);

    const presets = useMemo(() => buildPresetIntents(chainId), [chainId]);

    async function runIntent(intent: Intent) {
        if (!renegadeConfig) return;
        setRunning(true);
        try {
            const ctx = makeTaskContext(
                renegadeConfig,
                wagmiConfig,
                keychainNonce ?? BigInt(0),
                connection,
                signTransaction ?? undefined,
                solanaAddress,
            );
            const tasks = await planTasks(intent, ctx);
            console.log("🚀 ~ runIntent ~ tasks:", tasks);
            const queue = new TaskQueue(tasks);
            await queue.run();
            addLog(`${intent.kind} finished`);
        } catch (err) {
            console.error(err);
            addLog(`Error: ${(err as Error).message}`);
        } finally {
            setRunning(false);
        }
    }

    if (!renegadeConfig) {
        return (
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Ramp v2 Demo</h1>
                <p className="mt-4 text-muted-foreground">Connect your wallet to begin.</p>
            </main>
        );
    }

    return (
        <main className="p-6 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Ramp v2 Demo</h1>
            <section className="mt-6 space-y-3 w-full">
                {presets.map(({ label, intent }) => (
                    <Button
                        key={label}
                        className="w-full"
                        disabled={running}
                        onClick={() => runIntent(intent)}
                    >
                        {label}
                    </Button>
                ))}
            </section>
            <section className="mt-6 space-y-2">
                {log.map((l, i) => (
                    <p key={i} className="text-sm">
                        {l}
                    </p>
                ))}
            </section>
        </main>
    );
}

import { zeroAddress } from "@/lib/token";
import { solana } from "@/lib/viem";

const DEFAULT_USER_ADDRESS = zeroAddress as `0x${string}`;

function buildPresetIntents(toChainId: number): Array<{ label: string; intent: Intent }> {
    const chainNames: Record<number, string> = {
        [arbitrum.id]: "Arbitrum",
        [base.id]: "Base",
        [mainnet.id]: "Mainnet",
    };
    const chainName = chainNames[toChainId] ?? `Chain ${toChainId}`;

    const usdcDecimals = getTokenByTicker("USDC", toChainId)?.decimals ?? 6;
    const usdtDecimals = getTokenByTicker("USDT", toChainId)?.decimals ?? 6;
    const wethDecimals = getTokenByTicker("WETH", toChainId)?.decimals ?? 18;

    return [
        {
            label: `Deposit 1.1 USDC from Solana to ${chainName}`,
            intent: new Intent({
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: solana.id,
                toChain: toChainId,
                fromTicker: "USDC",
                toTicker: "USDC",
                amountAtomic: parseUnits("1.1", usdcDecimals),
            }),
        },
        {
            label: `Deposit 1.1 USDC from Mainnet to ${chainName}`,
            intent: new Intent({
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: toChainId,
                fromTicker: "USDC",
                toTicker: "USDC",
                amountAtomic: parseUnits("1.1", usdcDecimals),
            }),
        },
        {
            label: `Deposit 1 USDT from Mainnet to ${chainName}`,
            intent: new Intent({
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: mainnet.id,
                toChain: toChainId,
                fromTicker: "USDT",
                toTicker: "USDC",
                amountAtomic: parseUnits("1", usdtDecimals),
            }),
        },
        {
            label: `Deposit 1.1 USDC on ${chainName}`,
            intent: new Intent({
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                toTicker: "USDC",
                amountAtomic: parseUnits("1.1", usdcDecimals),
            }),
        },
        {
            label: `Deposit 0.001 ETH on ${chainName}`,
            intent: new Intent({
                kind: "DEPOSIT",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                fromTicker: "ETH",
                toTicker: "WETH",
                amountAtomic: parseUnits("0.001", wethDecimals),
            }),
        },
        {
            label: `Withdraw 0.001 WETH on ${chainName}`,
            intent: new Intent({
                kind: "WITHDRAW",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                toTicker: "WETH",
                amountAtomic: parseUnits("0.001", wethDecimals),
            }),
        },
        {
            label: `Withdraw 0.001 WETH → ETH on ${chainName}`,
            intent: new Intent({
                kind: "WITHDRAW",
                userAddress: DEFAULT_USER_ADDRESS,
                fromChain: toChainId,
                toChain: toChainId,
                fromTicker: "WETH",
                toTicker: "ETH",
                amountAtomic: parseUnits("0.001", wethDecimals),
            }),
        },
    ];
}
