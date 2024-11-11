import { NextResponse } from "next/server"

import { get } from "@vercel/edge-config"

export const runtime = "edge"

export async function GET() {
  const maintenanceMode = await get<MaintenanceMode>("maintenance_mode")
  return NextResponse.json(maintenanceMode)
}

export interface MaintenanceMode {
  enabled: boolean
  bannerMessage: string
  severity: "info" | "warning" | "critical"
  reason: string
}
