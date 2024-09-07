"use client"

import React from "react"

import { parseCookie } from "@renegade-fi/react"

import { setSide as setSideCookie } from "@/app/trade/[base]/actions"

import { Side } from "@/lib/constants/protocol"
import { STORAGE_SIDE } from "@/lib/constants/storage"

type SideContextType = {
  side: Side
  setSide: (side: Side) => void
}

const SideContext = React.createContext<SideContextType | undefined>(undefined)

export function SideProvider({
  children,
  cookie,
}: {
  children: React.ReactNode
  cookie: string | null
}) {
  const [side, setSideState] = React.useState<Side>(() => {
    if (cookie) {
      const parsed = parseCookie(cookie, STORAGE_SIDE)
      return parsed === Side.BUY ? Side.BUY : Side.SELL
    }
    const randomSide = Math.random() < 0.5 ? Side.BUY : Side.SELL
    return randomSide
  })

  const setSide = (newSide: Side) => {
    setSideState(newSide)
    setSideCookie(newSide)
  }

  return (
    <SideContext.Provider value={{ side, setSide }}>
      {children}
    </SideContext.Provider>
  )
}

export function useSide() {
  const context = React.useContext(SideContext)
  if (context === undefined) {
    throw new Error("useSide must be used within a SideProvider")
  }
  return context
}
