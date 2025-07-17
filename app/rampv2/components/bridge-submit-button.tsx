"use client";

import { getStepTransaction } from "@lifi/sdk";
import type { Connection } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { MaintenanceButtonWrapper } from "@/components/ui/maintenance-button-wrapper";
import { getFormattedChainName, solana } from "@/lib/viem";
import type { Intent } from "../core/intent";
import type { Task } from "../core/task";
import { balanceKey } from "../helpers";
import { maxBalancesQuery } from "../queries/renegade-balance";
import { solBalanceQuery, solFeeQuery } from "../queries/solana-gas";
import type { TaskQueue as TaskQueueType } from "../queue/task-queue";
import { TaskQueue } from "../queue/task-queue";

interface BridgeSubmitButtonProps {
    targetMint?: string;
    renegadeConfig: any;
    intent?: Intent;
    balances: Record<string, bigint>;
    tasks?: Task[];
    status: string;
    onQueueStart?: (queue: TaskQueueType) => void;
    connection: Connection;
    solanaAddress: string | null;
    route?: import("@lifi/sdk").Route;
}

export function BridgeSubmitButton({
    targetMint,
    renegadeConfig,
    intent,
    balances,
    tasks,
    status,
    onQueueStart,
    connection,
    solanaAddress,
    route,
}: BridgeSubmitButtonProps) {
    // Check if max balances are reached for the target token
    const { data: maxBalancesReached } = useQuery({
        ...maxBalancesQuery({ mint: targetMint ?? "", renegadeConfig }),
        enabled: !!targetMint,
    });

    // Balance sufficiency check
    const hasEnoughBalance = useMemo(() => {
        if (!intent) return true;
        const key = balanceKey(intent.fromChain, intent.fromTokenAddress);
        const available = balances[key] ?? BigInt(0);
        return intent.isBalanceSufficient(available);
    }, [intent, balances]);

    // ------------------------- Solana Gas Checks ------------------------- //
    const isSolanaSource = intent?.fromChain === solana.id;

    // Native SOL balance
    const { data: solBalance } = useQuery({
        ...solBalanceQuery({ connection, payer: solanaAddress ?? "" }),
        enabled: isSolanaSource && !!solanaAddress,
    });

    // Find the first Solana leg in the LI.FI route (if any)
    const solanaLeg = useMemo(() => {
        if (!isSolanaSource || !route?.steps?.length) return undefined;
        return route.steps.find((s) => s.action.fromChainId === solana.id);
    }, [isSolanaSource, route]);

    // Fetch populated transaction request for that leg
    const { data: solTxRequest } = useQuery({
        queryKey: ["solana-tx-request", solanaLeg?.id],
        queryFn: async () => {
            if (!solanaLeg) return undefined;
            const populated = await getStepTransaction(solanaLeg);
            return populated?.transactionRequest;
        },
        enabled: !!solanaLeg,
        staleTime: 0,
    });

    // Fee estimation
    const { data: solFee } = useQuery({
        ...solFeeQuery({
            connection,
            payer: solanaAddress ?? "", // guarded by enabled flag
            transactionRequest: solTxRequest!,
        }),
        enabled: !!solTxRequest && !!solanaAddress,
    });

    const hasEnoughGas = useMemo(() => {
        if (!isSolanaSource) return true;
        if (!solBalance?.raw || !solFee?.raw) return true; // assume ok while loading
        return solBalance.raw >= solFee.raw;
    }, [isSolanaSource, solBalance?.raw, solFee?.raw]);

    const getDisplayLabel = () => {
        if (maxBalancesReached) {
            return "Max balances reached";
        }

        if (!hasEnoughBalance) {
            const chainName = intent ? getFormattedChainName(intent.fromChain) : "";
            return `Insufficient ${chainName} balance`;
        }

        if (!hasEnoughGas) {
            return `Insufficient SOL for fees`;
        }

        return "Bridge & Deposit";
    };

    const isDisabled =
        maxBalancesReached || !hasEnoughBalance || !hasEnoughGas || status !== "success";

    function handleSubmit() {
        if (!tasks || tasks.length === 0) return;

        const queue = new TaskQueue(tasks);
        if (onQueueStart) {
            onQueueStart(queue);
            return;
        }

        queue.run().catch(console.error);
    }

    return (
        <div className="w-full flex">
            <MaintenanceButtonWrapper messageKey="transfer" triggerClassName="flex-1">
                <Button
                    className="w-full flex-1 border-0 border-t font-extended text-2xl"
                    disabled={isDisabled}
                    onClick={handleSubmit}
                    size="xl"
                    type="submit"
                    variant="outline"
                >
                    {getDisplayLabel()}
                </Button>
            </MaintenanceButtonWrapper>
        </div>
    );
}
