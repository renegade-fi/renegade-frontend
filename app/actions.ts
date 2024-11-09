"use server"

import { cookies } from "next/headers"

import { STORAGE_BASE } from "@/lib/constants/storage"

export async function deleteCookie(name: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(name)
}

export async function getBase(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get(STORAGE_BASE)?.value || "WETH"
}
