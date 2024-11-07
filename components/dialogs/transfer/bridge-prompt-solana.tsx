import { ConnectContent } from "@/app/components/wallet-sidebar/solana/connect-content"

import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { useWallets } from "@/hooks/use-wallets"
import { cn } from "@/lib/utils"

interface BridgePromptSolanaProps {
  hasUSDC: boolean
  onClick?: () => void
}

export function BridgePromptSolana({
  hasUSDC,
  onClick,
}: BridgePromptSolanaProps) {
  const { solanaWallet } = useWallets()

  const content = (
    <div
      className={cn(
        "cursor-pointer text-pretty border p-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary",
      )}
      onClick={hasUSDC ? onClick : undefined}
    >
      <div className="space-y-0.5">
        <Label className="cursor-inherit text-sm">
          {hasUSDC
            ? "Bridge and deposit USDC from Solana with 1-click."
            : "Connect Solana wallet to bridge and deposit USDC."}
        </Label>
        {hasUSDC && (
          <div className="text-[0.8rem] text-muted-foreground">
            Powered by Mayan
          </div>
        )}
      </div>
    </div>
  )

  // If wallet is connected, just return the content without the Dialog wrapper
  if (solanaWallet.isConnected) {
    return content
  }

  // If wallet is not connected, wrap content in Dialog
  return (
    <Dialog>
      <DialogTrigger asChild>{content}</DialogTrigger>
      <ConnectContent />
    </Dialog>
  )
}
