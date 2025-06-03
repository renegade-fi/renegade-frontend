import { NextResponse } from "next/server"

import { isAddress } from "viem"
import { arbitrum, arbitrumSepolia } from "viem/chains"

import {
  readErc20BalanceOf,
  readEthBalance,
  readSplBalanceOf,
} from "@/app/api/utils"

import { env as clientEnv } from "@/env/client"
import { env } from "@/env/server"
import {
  ADDITIONAL_TOKENS,
  DISPLAY_TOKENS,
  ETHEREUM_TOKENS,
  SOLANA_TOKENS,
} from "@/lib/token"

export const runtime = "edge"

const tokens = DISPLAY_TOKENS({
  chainId:
    clientEnv.NEXT_PUBLIC_CHAIN_ENVIRONMENT == "mainnet"
      ? arbitrum.id
      : arbitrumSepolia.id,
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")
  const solanaAddress = searchParams.get("solanaAddress")

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "No address provided or invalid address" },
      { status: 400 },
    )
  }

  // Fetch all balances in parallel
  const [
    arbitrumBalances,
    ethereumBalances,
    ethBalances,
    usdceBalance,
    solanaUsdcBalance,
  ] = await Promise.all([
    // Arbitrum token balances
    Promise.all(
      tokens.map(async (token) => ({
        ticker: token.ticker,
        balance: await readErc20BalanceOf(env.RPC_URL, token.address, address),
      })),
    ),

    // Ethereum token balances
    Promise.all(
      Object.values(ETHEREUM_TOKENS).map(async (token) => ({
        ticker: token.ticker,
        balance: await readErc20BalanceOf(
          env.RPC_URL_MAINNET,
          token.address,
          address,
        ),
      })),
    ),

    // Native ETH balances
    Promise.all([
      readEthBalance(env.RPC_URL_MAINNET, address),
      readEthBalance(env.RPC_URL, address),
    ]),

    // USDC.e balance
    readErc20BalanceOf(
      env.RPC_URL,
      ADDITIONAL_TOKENS["USDC.e"].address,
      address,
    ),

    // Solana USDC balance
    solanaAddress
      ? readSplBalanceOf(
          env.RPC_URL_SOLANA,
          SOLANA_TOKENS.USDC,
          solanaAddress,
        ).catch(() => BigInt(0))
      : Promise.resolve(BigInt(0)),
  ])

  // Combine all balances
  const combinedBalances = new Map<string, bigint>()

  // Add Arbitrum balances
  arbitrumBalances.forEach(({ ticker, balance }) => {
    combinedBalances.set(ticker, balance)
  })

  // Add Ethereum balances
  ethereumBalances.forEach(({ ticker, balance }) => {
    const current = combinedBalances.get(ticker) || BigInt(0)
    combinedBalances.set(ticker, current + balance)
  })

  // Add ETH balances to WETH
  const [ethBalanceL1, ethBalanceL2] = ethBalances
  const currentWeth = combinedBalances.get("WETH") || BigInt(0)
  combinedBalances.set("WETH", currentWeth + ethBalanceL1 + ethBalanceL2)

  // Add USDC.e balance to USDC
  const currentUsdc = combinedBalances.get("USDC") || BigInt(0)
  combinedBalances.set("USDC", currentUsdc + usdceBalance)

  // Add Solana USDC balance to USDC
  const updatedUsdc = combinedBalances.get("USDC") || BigInt(0)
  combinedBalances.set("USDC", updatedUsdc + solanaUsdcBalance)

  // Convert BigInt values to strings
  const balances = Object.fromEntries(
    Array.from(combinedBalances.entries()).map(([key, value]) => [
      key,
      value.toString(),
    ]),
  )

  return NextResponse.json(balances)
}
