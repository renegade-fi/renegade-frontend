"use client"

import { RenegadeProvider as Provider } from "@renegade-fi/react"
import { cookieToInitialState } from "@renegade-fi/react"

import { config } from "./config"

interface RenegadeProviderProps {
  children: React.ReactNode
  cookieString?: string
}

export function RenegadeProvider({
  children,
  cookieString,
}: RenegadeProviderProps) {
  const initialState = cookieToInitialState(config, cookieString)

  return (
    <Provider
      config={config}
      initialState={initialState}
      reconnectOnMount
    >
      {children}
    </Provider>
  )
}
