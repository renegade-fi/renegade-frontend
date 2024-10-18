import { NextResponse } from "next/server"

import { isAddress } from "viem"

import { readErc20BalanceOf, readEthBalance } from "@/app/api/utils"

import { ADDITIONAL_TOKENS, DISPLAY_TOKENS, ETHEREUM_TOKENS } from "@/lib/token"

const tokens = DISPLAY_TOKENS()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "No address provided or invalid address" },
      { status: 400 },
    )
  }

  const combinedBalances = new Map<string, bigint>()

  // Arbitrum balances
  await Promise.all(
    tokens.map(async (token) => {
      const balance = await readErc20BalanceOf(
        process.env.RPC_URL!,
        token.address,
        address,
      )
      combinedBalances.set(token.ticker, balance)
    }),
  )

  // Ethereum balances
  await Promise.all(
    Object.values(ETHEREUM_TOKENS).map(async (token) => {
      const balance = await readErc20BalanceOf(
        process.env.RPC_URL_MAINNET!,
        token.address,
        address,
      )
      const currentBalance = combinedBalances.get(token.ticker) || BigInt(0)
      combinedBalances.set(token.ticker, currentBalance + balance)
    }),
  )

  // Add native ETH balance to WETH
  const ethBalanceL1 = await readEthBalance(
    process.env.RPC_URL_MAINNET!,
    address,
  )
  const ethBalanceL2 = await readEthBalance(process.env.RPC_URL!, address)
  const currentWethBalance = combinedBalances.get("WETH") || BigInt(0)
  combinedBalances.set("WETH", currentWethBalance + ethBalanceL1 + ethBalanceL2)

  // Add USDC.e balance to USDC
  const usdceBalance = await readErc20BalanceOf(
    process.env.RPC_URL!,
    ADDITIONAL_TOKENS["USDC.e"].address,
    address,
  )
  const currentUsdcBalance = combinedBalances.get("USDC") || BigInt(0)
  combinedBalances.set("USDC", currentUsdcBalance + usdceBalance)

  // Convert BigInt values to strings
  const balances = Object.fromEntries(
    Array.from(combinedBalances.entries()).map(([key, value]) => [
      key,
      value.toString(),
    ]),
  )

  return NextResponse.json(balances)
}
