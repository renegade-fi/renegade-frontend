import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CREATE_WALLET_ERROR,
  CREATE_WALLET_START,
  CREATE_WALLET_SUCCESS,
  LOOKUP_WALLET_ERROR,
  LOOKUP_WALLET_START,
  LOOKUP_WALLET_SUCCESS,
} from '@/lib/constants/toast'
import { chain } from '@/lib/viem'
import { useConfig } from '@renegade-fi/react'
import { connect } from '@renegade-fi/react/actions'
import { ROOT_KEY_MESSAGE_PREFIX } from '@renegade-fi/react/constants'
import { toast } from 'sonner'
import { useSignMessage } from 'wagmi'

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: () => void
}) {
  const { signMessage } = useSignMessage()
  const config = useConfig()

  const handleClick = () =>
    signMessage(
      {
        message: `${ROOT_KEY_MESSAGE_PREFIX} ${chain.id}`,
      },
      {
        async onSuccess(data) {
          console.log('signed message: ', data)
          config.setState(x => ({ ...x, seed: data }))
          const res = await connect(config)
          if (res?.job) {
            const { isLookup, job } = res
            toast.promise(job, {
              loading: isLookup ? LOOKUP_WALLET_START : CREATE_WALLET_START,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock your Wallet</DialogTitle>
          <DialogDescription>
            To trade on Renegade, we require a one-time signature to unlock and
            create your wallet.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleClick} variant="outline">
          Sign in to Renegade
        </Button>
      </DialogContent>
    </Dialog>
  )
}
