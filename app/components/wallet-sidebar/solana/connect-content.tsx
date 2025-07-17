import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useSolanaWallets } from "@/app/hooks/use-solana-wallets";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useIsMobile } from "@/hooks/use-mobile";
import { truncateAddress } from "@/lib/format";

interface ConnectContentProps {
    className?: string;
}

export function ConnectContent({ className }: ConnectContentProps) {
    const wallets = useSolanaWallets();
    const { select } = useWallet();
    const isMobile = useIsMobile();

    const connectMutation = useMutation({
        mutationFn: async (wallet: Wallet) => {
            select(wallet.adapter.name);
            return new Promise<string>((resolve, reject) => {
                wallet.adapter.once("connect", (publicKey) => {
                    resolve(publicKey.toString());
                });
                wallet.adapter.once("error", (error) => {
                    reject(error);
                });
                setTimeout(() => reject(new Error("Connection timeout")), 30000);
            });
        },
        onMutate: (wallet) => {
            toast.loading("Connecting Wallet", {
                id: `connect-${wallet.adapter.name}`,
                description: `Connecting to ${wallet.adapter.name}...`,
                icon: <Loader2 className="h-4 w-4 animate-spin text-black" />,
            });
        },
        onSuccess: (publicKey, wallet) => {
            toast.success("Ready to deposit USDC", {
                id: `connect-${wallet.adapter.name}`,
                icon: undefined,
                description: `Connected to ${truncateAddress(publicKey)}`,
            });
        },
        onError: (error, wallet) => {
            toast.error("Connection Failed", {
                id: `connect-${wallet.adapter.name}`,
                icon: undefined,
                description: error instanceof Error ? error.message : "Unknown error occurred",
            });
            console.error("Failed to connect:", error);
        },
    });

    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">
                    This feature is only available on desktop
                </p>
            </div>
        );
    }

    if (connectMutation.isPending && connectMutation.variables) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                    <Avatar className="h-24 w-24">
                        {connectMutation.variables.adapter.icon && (
                            <AvatarImage
                                alt={`${connectMutation.variables.adapter.name} icon`}
                                className="animate-pulse"
                                src={connectMutation.variables.adapter.icon}
                            />
                        )}
                        <AvatarFallback className="text-2xl">
                            {connectMutation.variables.adapter.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 rounded-full bg-background p-1">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                    Connecting to {connectMutation.variables.adapter.name}...
                </p>
            </div>
        );
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Solana USDC Bridge</DialogTitle>
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Connect your Solana wallet to bridge USDC to your Arbitrum wallet
                    </p>
                    <p className="text-xs italic text-muted-foreground/75">
                        Note: This wallet will only be used for bridging funds, it cannot directly
                        interact with the Renegade protocol.
                    </p>
                </div>
            </DialogHeader>
            <div className="grid gap-3 py-4">
                {!wallets?.length ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-sm text-muted-foreground">No Solana wallets found.</p>
                    </div>
                ) : (
                    wallets.map((wallet) => (
                        <Button
                            className="flex w-full justify-between px-5 py-8 text-base font-normal"
                            disabled={connectMutation.isPending}
                            key={wallet.adapter.name}
                            onClick={() => connectMutation.mutate(wallet)}
                            variant="outline"
                        >
                            <span className="font-extended font-bold">{wallet.adapter.name}</span>
                            <Avatar className="h-8 w-8">
                                {wallet.adapter.icon && (
                                    <AvatarImage
                                        alt={`${wallet.adapter.name} icon`}
                                        src={wallet.adapter.icon}
                                    />
                                )}
                                <AvatarFallback className="text-base">
                                    {wallet.adapter.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    ))
                )}
            </div>
        </>
    );
}
