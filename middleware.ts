import { NextRequest, NextResponse } from "next/server"

import { STORAGE_BASE } from "@/lib/constants/storage"

export function middleware(request: NextRequest) {
  // Redirect root and /trade paths
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/trade"
  ) {
    const currentBase = request.cookies.get(STORAGE_BASE)?.value || "WETH"
    return NextResponse.redirect(new URL(`/trade/${currentBase}`, request.url))
  }

  // Extract BASE from /trade/{BASE} path and handle USDC case
  const baseMatch = request.nextUrl.pathname.match(/^\/trade\/([^\/]+)/)
  if (baseMatch) {
    const base = baseMatch[1]
    if (base === "USDC") {
      const currentBase = request.cookies.get(STORAGE_BASE)?.value || "WETH"
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
