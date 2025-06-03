import { deserialize, parseCookie } from "wagmi"
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

export function cookieToInitialState(key: string, cookie?: string | null) {
  if (!cookie) return undefined
  const parsed = parseCookie(decodeURIComponent(cookie), key)
  if (!parsed) return undefined
  return deserialize<{ state: ServerState }>(parsed).state
}
