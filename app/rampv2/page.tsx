"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfig as useRenegadeConfig } from "@/providers/state-provider/hooks";

import BridgeForm from "./forms/bridge-form";
import DepositForm from "./forms/deposit-form";
import WithdrawForm from "./forms/withdraw-form";

export default function RampV2Page() {
    const renegadeConfig = useRenegadeConfig();
    const { address } = useAccount();
    const { publicKey } = useWallet();
    const solanaAddress = publicKey ? publicKey.toBase58() : undefined;

    // "deposit" is the default tab
    const [mode, setMode] = useState<"bridge" | "deposit" | "withdraw">("deposit");

    // Guard: require wallet connection + renegade config
    if (!renegadeConfig || (!address && !solanaAddress)) {
        return (
            <main className="p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold">Ramp v2 Demo</h1>
                <p className="mt-4 text-muted-foreground">Connect your wallet to begin.</p>
            </main>
        );
    }

    return (
        <main>
            <section>
                {/* Mode toggle */}
                <div className="flex flex-row border-b border-border">
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "bridge" ? "text-primary" : "text-muted-foreground",
                        )}
                        size="xl"
                        variant="outline"
                        onClick={() => setMode("bridge")}
                    >
                        Bridge
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "deposit" ? "text-primary" : "text-muted-foreground",
                        )}
                        size="xl"
                        variant="outline"
                        onClick={() => setMode("deposit")}
                    >
                        Deposit
                    </Button>
                    <Button
                        className={cn(
                            "flex-1 border-0 font-extended text-lg font-bold",
                            mode === "withdraw" ? "text-primary" : "text-muted-foreground",
                        )}
                        size="xl"
                        variant="outline"
                        onClick={() => setMode("withdraw")}
                    >
                        Withdraw
                    </Button>
                </div>

                {/* Render selected form */}
                {mode === "bridge" ? (
                    <BridgeForm />
                ) : mode === "deposit" ? (
                    <DepositForm />
                ) : (
                    <WithdrawForm />
                )}
            </section>
        </main>
    );
}
