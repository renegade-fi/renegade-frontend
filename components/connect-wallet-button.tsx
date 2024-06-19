import { Button } from '@/components/ui/button'
import { useModal } from 'connectkit'
import { useAccount, useDisconnect } from 'wagmi'

export function ConnectWalletButton() {
  const { status, address } = useAccount()
  const { setOpen } = useModal()
  const { disconnect } = useDisconnect()

  const handleClick = () => {
    if (status === 'connected' || status === 'reconnecting') {
      disconnect()
    } else {
      setOpen(true)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="shimmer"
      className="font-extended text-base"
    >
      {address ? `Disconnect ${address?.slice(0, 6)}` : 'Connect Wallet'}
    </Button>
  )
}
