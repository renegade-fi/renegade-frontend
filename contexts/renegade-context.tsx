'use client'

import { deriveSeedFromQuoterKey } from '@/app/quoter/actions'
import { Config, connect, useInitialized, useStatus } from '@renegade-fi/react'
import { useCallback, useEffect, useRef } from 'react'

import { QuoterKey } from '@/lib/constants'
import { RenegadeProvider as _RenegadeProvider } from '@renegade-fi/react'

export const RenegadeProvider = ({
  children,
  config,
  quoterKey,
}: React.PropsWithChildren<{ config: Config; quoterKey: QuoterKey }>) => {
  const status = useStatus({ config })
  const initialized = useInitialized({ config })
  const attemptConnect = useRef(false)

  const handleConnect = useCallback(async () => {
    attemptConnect.current = true
    const seed = await deriveSeedFromQuoterKey(quoterKey)
    const res = await connect(config, { seed })
    if (res?.job) {
      await res.job
    }
  }, [config, quoterKey])

  useEffect(() => {
    if (!initialized || attemptConnect.current || status !== 'disconnected') {
      return
    }
    handleConnect()
  }, [handleConnect, initialized, status])
  return (
    <_RenegadeProvider config={config} reconnectOnMount={false}>
      {children}
    </_RenegadeProvider>
  )
}
