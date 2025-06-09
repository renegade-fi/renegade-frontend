"use client"

import { createContext, useContext, useLayoutEffect, useState } from "react"

import { RustUtils } from "@renegade-fi/react"

const WasmContext = createContext<{ isInitialized: boolean }>({
  isInitialized: false,
})

export function WasmProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  // useLayoutEffect here to initialize Rust utils before paint
  useLayoutEffect(() => {
    RustUtils().then(() => {
      console.log("Rust utils initialized")
      setIsInitialized(true)
    })
  }, [])

  return (
    <WasmContext.Provider value={{ isInitialized }}>
      {children}
    </WasmContext.Provider>
  )
}

export function useWasm(): { isInitialized: boolean } {
  const context = useContext(WasmContext)
  if (context === null) {
    throw new Error("useWasm must be used within WasmProvider")
  }
  return context
}
