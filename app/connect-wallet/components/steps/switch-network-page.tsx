import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { useAccount } from "wagmi"

import { useWagmiMutation } from "@/app/connect-wallet/context/wagmi-mutation-context"

import { TokenIcon } from "@/components/token-icon"
import { Button } from "@/components/ui/button"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils"
import { chain, getChainLogoTicker } from "@/lib/viem"

// May not navigate to this page because of programmatic chain set on connect
export function SwitchNetworkPage() {
  const { connector } = useAccount()
  const { switchChain, switchChainStatus, error } = useWagmiMutation()

  const isPending = switchChainStatus === "pending"

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{"Switch Network"}</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            Please switch to Arbitrum One to continue
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>

      <div className="flex flex-col items-center justify-center gap-2 p-8">
        <TokenIcon
          size={64}
          ticker={getChainLogoTicker(chain.id)}
        />

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-semibold">
            {error ? "Request Cancelled" : "Requesting Network Switch"}
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            {error
              ? "You cancelled the request. Click above to try again."
              : `Open the ${connector?.name} browser extension to switch your network to ${chain.name}.`}
          </p>
        </div>
      </div>
      <DialogFooter className={cn(isPending && "hidden")}>
        <Button
          className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
          size="xl"
          variant="outline"
          onClick={() => switchChain({ chainId: chain.id })}
        >
          Switch Network
        </Button>
      </DialogFooter>
    </>
  )
}
