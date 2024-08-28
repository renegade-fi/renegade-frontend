import { NextRequest } from "next/server"

import { createPublicClient, http, parseAbi, parseAbiItem } from "viem"

import { chain } from "@/lib/viem"
import { DISPLAY_TOKENS } from "@/lib/token"

export const runtime = "edge"

// Necessary because public RPC does not support getting logs
const viemClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_URL),
})

export async function GET(req: NextRequest) {
  const tokens = DISPLAY_TOKENS()
  try {
    const tvlPromises = tokens.map(token => getTvl(token.address));
    const tvlResults = await Promise.all(tvlPromises);

    const tvlData = tokens.map((token, index) => ({
      ticker: token.ticker,
      tvl: tvlResults[index].toString()
    }));

    return new Response(JSON.stringify({ data: tvlData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}

function getTvl(address: `0x${string}`) {
  return viemClient.readContract({
    address,
    abi,
    functionName: "balanceOf",
    args: [process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT],
  })
}

const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
])
