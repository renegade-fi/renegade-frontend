"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as React from "react";
import { useAccount, useConfig as useWagmiConfig } from "wagmi";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useCurrentChain, useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";
import { PayFees } from "./components/pay-fees";
import { TaskQueueStatus } from "./components/task-queue-status";
import BridgeForm from "./forms/bridge-form";
import DepositForm from "./forms/deposit-form";
import WithdrawForm from "./forms/withdraw-form";
import type { TaskQueue } from "./queue/task-queue";

/**
 * Dialog wrapper for the Ramp flows (bridge / deposit / withdraw).
 */
export function RampDialog({
    children,
    initialMint,
}: {
    children: React.ReactNode;
    initialMint?: `0x${string}`;
}) {
    const [open, setOpen] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    // --- Environment construction --- //
    const renegadeConfig = useRenegadeConfig();
    const wagmiConfig = useWagmiConfig();
    const currentChain = useCurrentChain();

    const { address } = useAccount();
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : null;

    const { data: keychainNonce } = useBackOfQueueWallet({
        query: { select: (w) => w.key_chain.nonce },
    });

    // Guard – we cannot proceed without these essentials.
    const missingEssential = !renegadeConfig || !wagmiConfig || !address;

    // --- Internal UI state --- //
    const [mode, setMode] = React.useState<"bridge" | "deposit" | "withdraw">("deposit");
    const [queue, setQueue] = React.useState<TaskQueue | null>(null);

    // Helper passed down to forms so they can start a queue.
    function handleQueueStart(q: TaskQueue) {
        setQueue(q);
        q.run().catch(console.error);
    }

    function handleOpenChange(open: boolean) {
        setQueue(null);
        setOpen(open);
    }

    // --- Render --- //
    return (
        <Dialog onOpenChange={handleOpenChange} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className={cn("gap-0 p-0", {
                    "grid-rows-[auto_1fr] h-dvh": !isDesktop,
                    "sm:max-w-[425px]": isDesktop,
                })}
                hideCloseButton={isDesktop}
                // Prevent toasts inside the dialog from closing it when clicked
                onPointerDownOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest("[data-sonner-toast]")) {
                        e.preventDefault();
                    }
                }}
            >
                {missingEssential ? (
                    <div className="p-6 text-center text-muted-foreground">
                        Connect your wallet to begin.
                    </div>
                ) : (
                    <>
                        <RampDialogBody
                            env={{
                                renegadeConfig,
                                wagmiConfig,
                                connection,
                                keychainNonce: keychainNonce ?? BigInt(0),
                                currentChain,
                                evmAddress: address as `0x${string}`,
                                solanaAddress,
                                solanaSignTx: signTransaction ?? null,
                            }}
                            initialMint={initialMint}
                            isDesktop={isDesktop}
                            mode={mode}
                            onQueueClose={() => handleOpenChange(false)}
                            onQueueStart={handleQueueStart}
                            queue={queue}
                            setMode={setMode}
                        />
                        <PayFees renegadeConfig={renegadeConfig} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// --- Internal dialog body component --- //
interface BodyProps {
    env: import("./types").RampEnv;
    initialMint?: `0x${string}`;
    mode: "bridge" | "deposit" | "withdraw";
    setMode: React.Dispatch<React.SetStateAction<"bridge" | "deposit" | "withdraw">>;
    queue: TaskQueue | null;
    onQueueStart: (q: TaskQueue) => void;
    onQueueClose: () => void;
    isDesktop: boolean;
}

function RampDialogBody({
    env,
    initialMint,
    mode,
    setMode,
    queue,
    onQueueStart,
    onQueueClose,
    isDesktop,
}: BodyProps) {
    return queue ? (
        <>
            <DialogHeader>
                <DialogTitle className="px-6 py-4  font-extended text-lg font-bold">
                    {mode === "bridge" ? "Bridge" : mode === "deposit" ? "Deposit" : "Withdraw"}
                </DialogTitle>
            </DialogHeader>
            <TaskQueueStatus onClose={onQueueClose} queue={queue} />
        </>
    ) : (
        <>
            <VisuallyHidden>
                <DialogTitle>
                    {mode === "bridge" ? "Bridge" : mode === "deposit" ? "Deposit" : "Withdraw"}
                </DialogTitle>
            </VisuallyHidden>
            {/* Mode toggle */}
            <div className={cn("flex", isDesktop ? "border-b" : "px-6 pt-12 pb-0")}>
                <Button
                    className={cn(
                        "flex-1 font-extended text-lg font-bold",
                        mode === "bridge" ? "text-primary" : "text-muted-foreground",
                        isDesktop ? "border-0" : "border",
                    )}
                    onClick={() => setMode("bridge")}
                    size="xl"
                    variant="outline"
                >
                    Bridge
                </Button>
                <Button
                    className={cn(
                        "flex-1 font-extended text-lg font-bold",
                        mode === "deposit" ? "text-primary" : "text-muted-foreground",
                        isDesktop ? "border-x border-y-0" : "border-x-0",
                    )}
                    onClick={() => setMode("deposit")}
                    size="xl"
                    variant="outline"
                >
                    Deposit
                </Button>
                <Button
                    className={cn(
                        "flex-1 font-extended text-lg font-bold",
                        mode === "withdraw" ? "text-primary" : "text-muted-foreground",
                        isDesktop ? "border-0" : "border",
                    )}
                    onClick={() => setMode("withdraw")}
                    size="xl"
                    variant="outline"
                >
                    Withdraw
                </Button>
            </div>

            {/* Render selected form */}
            {mode === "bridge" ? (
                <BridgeForm env={env} onQueueStart={onQueueStart} />
            ) : mode === "deposit" ? (
                <DepositForm env={env} initialMint={initialMint} onQueueStart={onQueueStart} />
            ) : (
                <WithdrawForm env={env} initialMint={initialMint} onQueueStart={onQueueStart} />
            )}
        </>
    );
}
