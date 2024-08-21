"use client"

import React from "react"

import { IntercomProvider as Provider } from "react-use-intercom"

export function IntercomProvider({
  children,
  isMobile,
}: {
  children: React.ReactNode
  isMobile?: boolean
}) {
  return (
    <Provider
      appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID}
      autoBoot
      initializeDelay={10000}
      shouldInitialize={process.env.NODE_ENV === "production" && !isMobile}
      autoBootProps={{
        verticalPadding: 20,
        horizontalPadding: 20,
      }}
    >
      {children}
    </Provider>
  )
}
