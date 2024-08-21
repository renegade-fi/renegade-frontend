import type { NextRequest } from "next/server"
import { NextResponse, userAgent } from "next/server"

import { STORAGE_BASE } from "@/lib/constants/storage"

export function middleware(request: NextRequest) {
  const { device } = userAgent(request)
  if (device.type === "mobile") {
    if (request.nextUrl.pathname !== "/m") {
      request.nextUrl.pathname = "/m"
      return NextResponse.rewrite(request.nextUrl)
    }
    return
  }
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/trade"
  ) {
    let defaultBase = "WETH"
    let cookie = request.cookies.get(STORAGE_BASE)
    if (cookie?.value) {
      defaultBase = cookie.value
    }
    return NextResponse.redirect(new URL(`/trade/${defaultBase}`, request.url))
  }

  if (request.nextUrl.pathname === "/trade/USDC") {
    return NextResponse.redirect(new URL("/trade/WETH/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/trade", "/trade/:path*"],
}
