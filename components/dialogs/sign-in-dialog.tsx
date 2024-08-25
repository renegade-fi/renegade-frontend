import { useConfig, useConnect } from "@renegade-fi/react"
import { getSkRoot } from "@renegade-fi/react/actions"
import { ROOT_KEY_MESSAGE_PREFIX } from "@renegade-fi/react/constants"
import { toast } from "sonner"
import { useSignMessage } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  CREATE_WALLET_ERROR,
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_ERROR,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from "@/lib/constants/toast"
import { chain } from "@/lib/viem"

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: () => void
}) {
  const {
    signMessage,
    status: signStatus,
    isSuccess: signSuccess,
  } = useSignMessage()
  const config = useConfig()

  const {
    connect,
    status: connectStatus,
    isSuccess: connectSuccess,
  } = useConnect()

  const handleClick = () =>
    signMessage(
      {
        message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
      },
      {
        async onSuccess(data) {
          console.log("signed message: ", data)
          config.setState((x) => ({ ...x, seed: data }))
          const blinderShare = config.utils.derive_blinder_share(data)
          const logs = await fetch(`/api/get-logs?blinderShare=${blinderShare}`)
            .then((res) => res.json())
            .then((data) => data.logs)

          connect(
            { isCreateWallet: logs === 0 },
            {
              onSuccess(data, variables, context) {
                if (data) {
                  const { isLookup, job } = data
                  toast.promise(job, {
                    loading: isLookup
                      ? LOOKUP_WALLET_START
                      : CREATE_WALLET_START,
                    success: () => {
                      if (!isLookup) {
                        return CREATE_WALLET_SUCCESS
                      }
                      return LOOKUP_WALLET_SUCCESS
                    },
                    error: isLookup ? LOOKUP_WALLET_ERROR : CREATE_WALLET_ERROR,
                  })
                }
                onOpenChange()
              },
            },
          )
        },
      },
    )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
        <DialogHeader className="p-6">
          <DialogTitle className="font-extended">
            Unlock your Wallet
          </DialogTitle>
          <DialogDescription>
            To trade on Renegade, we require a one-time signature to create or
            find your wallet on-chain.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            className="flex-1 border-x-0 border-b-0 border-t font-extended text-2xl"
            size="xl"
            onClick={handleClick}
            disabled={signStatus === "pending" || connectStatus === "pending"}
          >
            {signStatus === "pending" || connectStatus === "pending"
              ? "Confirm in wallet"
              : "Sign in to Renegade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
