import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const cookieName = await request.text()
  cookies().delete(cookieName)
  return new NextResponse(null, { status: 204 })
}
