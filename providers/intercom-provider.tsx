"use client"

import React from "react"

import { IntercomProvider as Provider } from "react-use-intercom"

export function IntercomProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider
      appId={process.env.NEXT_PUBLIC_INTERCOM_APP_ID}
      autoBoot
      initializeDelay={10000}
      shouldInitialize={process.env.NODE_ENV === "production"}
      autoBootProps={{
        verticalPadding: 20,
        horizontalPadding: 20,
      }}
    >
      {children}
    </Provider>
  )
}
