'use client'

import { RenegadeProvider as Provider } from '@renegade-fi/react'

import { config } from '@/providers/renegade-provider/config'

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
