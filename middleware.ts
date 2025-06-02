import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
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
