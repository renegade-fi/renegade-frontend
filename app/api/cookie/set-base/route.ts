import { NextRequest, NextResponse } from "next/server"

import { STORAGE_BASE } from "@/lib/constants/storage"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  const base = await request.text()

  const response = new NextResponse(null, { status: 204 })

  response.cookies.set(STORAGE_BASE, base, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}
