import { kv } from "@vercel/kv"

import {
  INFLOWS_KEY,
  INFLOWS_SET_KEY,
  NET_FLOW_KEY,
} from "@/app/api/stats/constants"
import { NetFlowResponse } from "@/app/api/stats/net-flow/route"
import { getAllSetMembers } from "@/app/lib/kv-utils"

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export const maxDuration = 300
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("Starting net flow calculation cron job")
  try {
    const now = Date.now()
    const twentyFourHoursAgo = now - TWENTY_FOUR_HOURS
    console.log(
      `Calculating net flow from ${new Date(twentyFourHoursAgo).toISOString()} to ${new Date(now).toISOString()}`,
    )

    const transactionHashes = await getAllSetMembers(kv, INFLOWS_SET_KEY)
    console.log(`Retrieved ${transactionHashes.length} transaction hashes`)

    const pipeline = kv.pipeline()
    transactionHashes.forEach((hash) => pipeline.get(`${INFLOWS_KEY}:${hash}`))
    const data = await pipeline.exec()
    console.log(`Fetched data for ${data.length} transactions`)

    let netFlow = 0
    let validTransactions = 0
    let skippedTransactions = 0

    data.forEach((item) => {
      if (
        item &&
        typeof item === "object" &&
        "timestamp" in item &&
        "amount" in item
      ) {
        const transfer = item as {
          timestamp: number
          amount: number
          isWithdrawal: boolean
        }
        if (transfer.timestamp >= twentyFourHoursAgo) {
          netFlow += transfer.isWithdrawal ? -transfer.amount : transfer.amount
          validTransactions++
        } else {
          skippedTransactions++
        }
      }
    })

    console.log(
      `Processed ${validTransactions} valid transactions, skipped ${skippedTransactions} outdated transactions`,
    )
    console.log(`Calculated net flow: ${netFlow}`)

    const response: NetFlowResponse = {
      netFlow,
      timestamp: now,
    }

    await kv.set(NET_FLOW_KEY, response)
    console.log("Net flow data updated successfully")

    return new Response(
      JSON.stringify({ message: "Net flow data updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error updating net flow data:", error)
    return new Response(
      JSON.stringify({ error: "Failed to update net flow data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
