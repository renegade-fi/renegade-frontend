import { useWallet } from "@solana/wallet-adapter-react";
import { Clipboard, ExternalLink, SquareX } from "lucide-react";

import { useSolanaChainBalance } from "@/components/dialogs/transfer/hooks/use-solana-balance";
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { Wallet } from "@/hooks/use-wallets";
import { solana } from "@/lib/viem";

interface SolanaWalletActionsDropdownProps {
    wallet: Wallet;
}

export function SolanaWalletActionsDropdown({ wallet }: SolanaWalletActionsDropdownProps) {
    const { disconnect } = useWallet();
    const { formatted } = useSolanaChainBalance({
        ticker: "USDC",
        enabled: wallet.isConnected,
    });

    const handleCopyAddress = () => {
        if (wallet.isConnected) {
            navigator.clipboard.writeText(wallet.id);
        }
    };

    const handleViewExplorer = () => {
        if (wallet.isConnected) {
            const explorerUrl = `${solana.blockExplorers.default.url}/account/${wallet.id}`;
            window.open(explorerUrl, "_blank");
        }
    };

    return (
        <>
            <DropdownMenuLabel className="break-words text-xs font-normal">
                {wallet.id}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Available to deposit
                <div className="mt-1 font-medium text-foreground">{formatted} USDC</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem disabled={!wallet.isConnected} onSelect={handleCopyAddress}>
                    <Clipboard />
                    Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!wallet.isConnected} onSelect={handleViewExplorer}>
                    <ExternalLink />
                    View on Explorer
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem disabled={!wallet.isConnected} onSelect={() => disconnect()}>
                    <SquareX />
                    Disconnect
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}
