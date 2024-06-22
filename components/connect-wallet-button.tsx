import { useState } from 'react'

import { useConfig, useInitialized, useStatus } from '@renegade-fi/react'
import { disconnect as disconnectRenegade } from '@renegade-fi/react/actions'
import { useModal } from 'connectkit'
import { useAccount, useDisconnect } from 'wagmi'

import { SignInDialog } from '@/components/dialogs/sign-in-dialog'
import { Button } from '@/components/ui/button'

export function ConnectWalletButton() {
  const { address } = useAccount()
  const config = useConfig()
  const { disconnect } = useDisconnect()
  const { setOpen } = useModal()
  const [openSignIn, setOpenSignIn] = useState(false)

  const onOpenChangeSignIn = () => setOpenSignIn(!openSignIn)

  const renegadeStatus = useStatus()

  const handleClick = () => {
    if (address) {
      if (renegadeStatus === 'in relayer') {
        disconnectRenegade(config)
        disconnect()
      } else {
        setOpenSignIn(true)
      }
    } else {
      setOpen(true)
    }
  }

  let content = ''
  if (address) {
    if (renegadeStatus === 'in relayer') {
      content = `Disconnect ${address?.slice(0, 6)}`
    } else {
      content = `Sign in with ${address?.slice(0, 6)}`
    }
  } else {
    content = 'Connect Wallet'
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant="shimmer"
        className="font-extended text-base"
      >
        {content}
      </Button>
      <SignInDialog open={openSignIn} onOpenChange={onOpenChangeSignIn} />
    </>
  )
}
