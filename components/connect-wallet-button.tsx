import { Button } from '@/components/ui/button'
import { ConnectKitButton } from 'connectkit'

export function ConnectWalletButton() {
  return (
    // <ConnectKitButton.Custom>
    //   {({ isConnected, isConnecting, show, hide, address, ensName, chain }) => {
    //     return (
    //       <Button
    //         onClick={show}
    //         variant="shimmer"
    //         className="font-extended text-base"
    //       >
    //         {isConnected ? chain?.name : 'Connect Wallet'}
    //       </Button>
    //     )
    //   }}
    // </ConnectKitButton.Custom>
    <ConnectKitButton />
  )
}
