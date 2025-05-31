import { NextRequest, NextResponse } from "next/server"

import { getBaseMint, getTickerForAddress } from "@/app/trade/[base]/utils"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage"
import { defaultInitState } from "@/providers/state-provider/server-store"

export function middleware(request: NextRequest) {
  // Redirect root or bare /trade to the user's default token
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/trade"
  ) {
    const cookieString = request.cookies.toString()
    const initialState = cookieToInitialState(
      STORAGE_SERVER_STORE,
      cookieString,
    )
    const serverState = initialState ?? defaultInitState
    const defaultAddress = getBaseMint(serverState)
    const fallbackTicker = getTickerForAddress(defaultAddress).toLowerCase()

    return NextResponse.redirect(
      new URL(`/trade/${fallbackTicker}`, request.url),
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/trade",
    "/trade/:path*",
    // exclude api routes, static files, etc
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
