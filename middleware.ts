import { NextRequest, NextResponse } from "next/server"

import { STORAGE_SERVER_STORE } from "@/lib/constants/storage"
import { cookieToInitialState } from "@/providers/state-provider/cookie-storage"

export function middleware(request: NextRequest) {
  const cookieString = request.cookies.toString()
  const serverState = cookieToInitialState(STORAGE_SERVER_STORE, cookieString)
  const currentBase = serverState?.order.base || "WETH"

  // Redirect root and /trade paths
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/trade"
  ) {
    return NextResponse.redirect(new URL(`/trade/${currentBase}`, request.url))
  }

  // Extract BASE from /trade/{BASE} path and handle USDC case
  const baseMatch = request.nextUrl.pathname.match(/^\/trade\/([^\/]+)/)
  if (baseMatch) {
    const base = baseMatch[1]
    if (base === "USDC") {
      return NextResponse.redirect(
        new URL(`/trade/${currentBase}`, request.url),
      )
    }
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
