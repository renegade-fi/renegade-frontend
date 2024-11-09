"use server"

import { cookies } from "next/headers"

import {
  STORAGE_BASE,
  STORAGE_IS_USDC_DENOMINATED,
  STORAGE_SIDE,
} from "@/lib/constants/storage"

async function setCookie(key: string, value: string) {
  const cookieStore = await cookies()
  cookieStore.set(key, value, {
    path: "/",
    sameSite: "strict",
    // Disable secure flag in development
    secure: process.env.NODE_ENV === "production",
    maxAge: 31536000,
  })
}

export async function setSide(side: "buy" | "sell") {
  setCookie(STORAGE_SIDE, side)
}

export async function setIsUSDCDenominated(isUSDCDenominated: boolean) {
  setCookie(STORAGE_IS_USDC_DENOMINATED, isUSDCDenominated ? "true" : "false")
}
