import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    const cookieName = await request.text()
    cookies().delete(cookieName)
    return new NextResponse(null, { status: 204 })
}