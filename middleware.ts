import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { STORAGE_BASE } from "@/lib/constants/storage"

export function middleware(request: NextRequest) {
  console.log("running middleware on path: ", request.nextUrl.pathname)
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

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/trade", "/trade/:path*"],
}
