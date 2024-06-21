'use client'

import { config } from '@/components/renegade-provider/config'
import { RenegadeProvider as Provider } from '@renegade-fi/react'

export function RenegadeProvider({
  children,
  initialState,
}: {
  children: React.ReactNode
  initialState: any
}) {
  return (
    <Provider config={config} initialState={initialState} reconnectOnMount>
      {children}
    </Provider>
  )
}
