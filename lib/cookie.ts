import { parseCookie } from "@renegade-fi/react"

export type BaseStorage = {
  getItem(
    key: string,
  ): string | null | undefined | Promise<string | null | undefined>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export const cookieStorage: BaseStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null
    const value = parseCookie(document.cookie, key)
    return value ?? null
  },
  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return
    const isProduction = process.env.NODE_ENV === "production"
    const secureFlag = isProduction ? "Secure;" : ""
    document.cookie = `${key}=${value};path=/;SameSite=Strict;${secureFlag}max-age=604800`
  },
  removeItem(key: string): void {
    if (typeof window === "undefined") return
    const isProduction = process.env.NODE_ENV === "production"
    const secureFlag = isProduction ? "Secure;" : ""
    document.cookie = `${key}=;path=/;SameSite=Strict;${secureFlag}max-age=-1`
  },
}
