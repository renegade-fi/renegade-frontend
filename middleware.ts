import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/trade"
  ) {
    let defaultBase = "WETH"
    // let cookie = request.cookies.get(STORAGE_BASE)
    // if (cookie?.value) {
    //   defaultBase = cookie.value
    // }
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
