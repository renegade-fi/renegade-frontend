"use server"

import { cookies } from "next/headers"

export async function deleteCookie(name: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(name)
}
