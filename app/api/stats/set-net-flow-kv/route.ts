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

export async function GET() {
  console.log("Starting net flow calculation cron job")
  try {
    const now = Date.now()
    const twentyFourHoursAgo = now - TWENTY_FOUR_HOURS
    console.log(
      `Calculating net flow from ${new Date(twentyFourHoursAgo).toISOString()} to ${new Date(now).toISOString()}`,
    )

    const transactionHashes = await getAllSetMembers(INFLOWS_SET_KEY)
    console.log(`Retrieved ${transactionHashes.length} transaction hashes`)

    // Use fetch pipeline to get all data in a single round-trip
    const pipelineBody = JSON.stringify(
      transactionHashes.map((hash) => ["GET", `${INFLOWS_KEY}:${hash}`]),
    )

    const pipelineResponse = await fetch(
      `${process.env.KV_REST_API_URL}/pipeline`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
        body: pipelineBody,
      },
    )

    if (!pipelineResponse.ok) {
      throw new Error(`HTTP error! status: ${pipelineResponse.status}`)
    }

    const pipelineResults = await pipelineResponse.json()
    console.log(`Fetched data for ${pipelineResults.length} transactions`)

    let netFlow = 0
    let validTransactions = 0
    let skippedTransactions = 0

    pipelineResults.forEach(({ result }: { result: string | null }) => {
      if (result === null) return

      try {
        const transfer = JSON.parse(result) as {
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
      } catch (error) {
        console.error("Error parsing result:", error)
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
