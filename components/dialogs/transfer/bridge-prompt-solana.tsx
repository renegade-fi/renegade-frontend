import { ConnectContent } from "@/app/components/wallet-sidebar/solana/connect-content";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { useIsMobile } from "@/hooks/use-mobile";
import { useWallets } from "@/hooks/use-wallets";
import { cn } from "@/lib/utils";

interface BridgePromptSolanaProps {
    hasUSDC: boolean;
    onClick?: () => void;
}

export function BridgePromptSolana({ hasUSDC, onClick }: BridgePromptSolanaProps) {
    const { solanaWallet } = useWallets();
    const isMobile = useIsMobile();

    const content = (
        <div
            className={cn("text-pretty border p-3 text-muted-foreground transition-colors", {
                "cursor-pointer hover:border-primary hover:text-primary":
                    !solanaWallet.isConnected || hasUSDC,
            })}
            onClick={hasUSDC ? onClick : undefined}
        >
            <div className="space-y-0.5">
                <div className="text-sm font-medium">
                    {!solanaWallet.isConnected
                        ? "Connect Solana wallet to deposit & bridge USDC"
                        : "Bridge and deposit USDC from Solana with 1-click."}
                </div>
                {(hasUSDC || solanaWallet.isConnected) && (
                    <div className="text-[0.8rem]">Powered by Mayan</div>
                )}
            </div>
        </div>
    );

    if (!solanaWallet.isConnected) {
        return (
            <Dialog>
                <DialogTrigger asChild>{content}</DialogTrigger>
                <DialogContent className={isMobile ? "h-full w-full" : "w-[343px]"}>
                    <ConnectContent />
                </DialogContent>
            </Dialog>
        );
    }

    if (hasUSDC) {
        return content;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent>You need balance on Solana to bridge.</TooltipContent>
        </Tooltip>
    );
}
