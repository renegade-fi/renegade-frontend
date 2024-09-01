"use server"

import { cookies } from "next/headers"

import {
  STORAGE_BASE,
  STORAGE_IS_USDC_DENOMINATED,
  STORAGE_SIDE,
} from "@/lib/constants/storage"

function setCookie(key: string, value: string) {
  cookies().set(key, value, {
    path: "/",
    sameSite: "strict",
    secure: true,
    maxAge: 31536000,
  })
}

export async function setSide(side: "buy" | "sell") {
  setCookie(STORAGE_SIDE, side)
}

export async function setIsUSDCDenominated(isUSDCDenominated: boolean) {
  setCookie(STORAGE_IS_USDC_DENOMINATED, isUSDCDenominated ? "true" : "false")
}

export async function setBase(base: string) {
  setCookie(STORAGE_BASE, base)
}
