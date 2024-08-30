import { NextRequest } from "next/server"

import { Token } from "@renegade-fi/react"
import { kv } from "@vercel/kv"
import {
  createPublicClient,
  http,
  parseAbiItem,
  isAddress,
  formatUnits,
} from "viem"

import { fetchAssetPrice } from "@/app/api/amberdata/helpers"
import {
  BLOCK_CHUNK_SIZE,
  LAST_PROCESSED_BLOCK_KEY,
  INFLOWS_KEY,
  ExternalTransferData,
  INFLOWS_SET_KEY,
} from "@/app/api/stats/constants"

import { amountTimesPrice } from "@/hooks/use-usd-price"
import { DISPLAY_TOKENS, remapToken } from "@/lib/token"
import { chain } from "@/lib/viem"

export const maxDuration = 300
export const dynamic = "force-dynamic"

const viemClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_URL),
})

async function getBlockTimestamps(
  blockNumbers: bigint[],
): Promise<Map<bigint, bigint>> {
  const blockNumberToTimestamp = new Map<bigint, bigint>()
  for (let i = 0; i < blockNumbers.length; i += BLOCK_CHUNK_SIZE) {
    const chunk = blockNumbers.slice(i, i + BLOCK_CHUNK_SIZE)
    const blockPromises = chunk.map((blockNumber) =>
      viemClient.getBlock({ blockNumber }),
    )
    const blocks = await Promise.all(blockPromises)
    blocks.forEach((block) =>
      blockNumberToTimestamp.set(block.number, block.timestamp),
    )
  }
  return blockNumberToTimestamp
}

export async function GET(req: NextRequest) {
  try {
    // Get all token prices
    const tokens = DISPLAY_TOKENS()
    const apiKey = process.env.NEXT_PUBLIC_AMBERDATA_API_KEY
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_AMBERDATA_API_KEY is not set")
    }

    const pricePromises = tokens.map((token) =>
      fetchAssetPrice(remapToken(token.ticker), apiKey),
    )
    const priceResults = await Promise.all(pricePromises)

    const priceData = tokens.map((token, index) => ({
      ticker: token.ticker,
      price: priceResults[index].payload.price,
    }))

    // Get the last processed block number
    let fromBlock = BigInt(
      (await kv.get(LAST_PROCESSED_BLOCK_KEY)) || process.env.FROM_BLOCK || 0,
    )
    console.log("🚀 ~ GET ~ fromBlock:", fromBlock)
    // Get all external transfer logs
    const logs = await viemClient.getLogs({
      address: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
      event: parseAbiItem(
        "event ExternalTransfer(address indexed account, address indexed mint, bool indexed is_withdrawal, uint256 amount)",
      ),
      fromBlock: fromBlock,
    })

    if (logs.length === 0) {
      return new Response(JSON.stringify({ message: "No new logs to process" }))
    }

    // Get timestamps for all blocks (chunked)
    const uniqueBlockNumbers = Array.from(
      new Set(logs.map((log) => log.blockNumber)),
    )
    const blockNumberToTimestamp = await getBlockTimestamps(uniqueBlockNumbers)

    // Process all logs
    const processPromises = logs.map(async (log) => {
      const mint = log.args.mint?.toString().toLowerCase()
      if (mint && isAddress(mint)) {
        const token = Token.findByAddress(mint)
        const price = priceData.find((tp) => tp.ticker === token?.ticker)?.price
        if (price && token && log.args.amount) {
          const usdVolume = amountTimesPrice(log.args.amount, price)
          const formatted = parseFloat(formatUnits(usdVolume, token.decimals))
          const timestamp = blockNumberToTimestamp.get(log.blockNumber)

          if (timestamp) {
            const data: ExternalTransferData = {
              timestamp: Number(timestamp) * 1000,
              amount: formatted,
              isWithdrawal: Boolean(log.args.is_withdrawal),
              mint,
              transactionHash: log.transactionHash,
            }

            // Write to KV store and add to Set
            await Promise.all([
              kv.set(
                `${INFLOWS_KEY}:${log.transactionHash}`,
                JSON.stringify(data),
              ),
              kv.sadd(INFLOWS_SET_KEY, log.transactionHash),
            ])
            return data
          }
        }
      }
      return null
    })

    const results = await Promise.all(processPromises)
    const processedResults = results.filter(
      (result): result is ExternalTransferData => result !== null,
    )

    // Store the last processed block number
    const lastProcessedBlock = logs[logs.length - 1].blockNumber
    await kv.set(LAST_PROCESSED_BLOCK_KEY, lastProcessedBlock.toString())

    return new Response(
      JSON.stringify({
        message: `Processed ${processedResults.length} logs`,
        lastProcessedBlock: lastProcessedBlock.toString(),
      }),
    )
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}
