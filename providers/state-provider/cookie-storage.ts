import { StateStorage } from "zustand/middleware"

import {
  getCookie,
  setCookie,
  removeCookie,
} from "@/providers/state-provider/cookie-actions"
import { ServerState } from "@/providers/state-provider/schema"

export const createCookieStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        return await getCookie(name)
      } catch (err) {
        console.error("Error getting cookie:", err)
        return null
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await setCookie(name, value)
      } catch (err) {
        console.error("Error setting cookie:", err)
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        await removeCookie(name)
      } catch (err) {
        console.error("Error removing cookie:", err)
      }
    },
  }
}

export function parseCookie(cookie: string, key: string) {
  const keyValue = cookie.split("; ").find((x) => x.startsWith(`${key}=`))
  if (!keyValue) return undefined
  return keyValue.substring(key.length + 1)
}

export function cookieToInitialState(key: string, cookie?: string | null) {
  if (!cookie) return undefined
  const parsed = parseCookie(decodeURIComponent(cookie), key)
  if (!parsed) return undefined
  try {
    const { state } = JSON.parse(parsed) as { state: ServerState }
    return state
  } catch (err) {
    console.error("Error parsing cookie:", err)
    return undefined
  }
}
