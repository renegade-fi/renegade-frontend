"use server"

import { cookies } from "next/headers"

import {
  STORAGE_SIDE,
  STORAGE_IS_USDC_DENOMINATED,
} from "@/lib/constants/storage"

export async function setSide(side: "buy" | "sell") {
  cookies().set(STORAGE_SIDE, side)
}

export async function setIsUSDCDenominated(isUSDCDenominated: boolean) {
  cookies().set(
    STORAGE_IS_USDC_DENOMINATED,
    isUSDCDenominated ? "true" : "false",
  )
}
