import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fundWallet = async (
  tokens: { ticker: string; amount: string }[],
  address: `0x${string}`,
) => {
  await fetch(`/api/faucet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tokens,
      address,
    }),
  })
}

export const fundList: { ticker: string; amount: string }[] = [
  { ticker: "WETH", amount: "3" },
  { ticker: "USDC", amount: "10000" },
  {
    ticker: "WBTC",
    amount: "0.2",
  },
  {
    ticker: "BNB",
    amount: "17",
  },
  {
    ticker: "MATIC",
    amount: "10000",
  },
  {
    ticker: "LDO",
    amount: "5000",
  },
  {
    ticker: "LINK",
    amount: "700",
  },
  {
    ticker: "UNI",
    amount: "1250",
  },
  {
    ticker: "SUSHI",
    amount: "5000",
  },
  {
    ticker: "1INCH",
    amount: "10000",
  },
  {
    ticker: "AAVE",
    amount: "120",
  },
  {
    ticker: "COMP",
    amount: "180",
  },
  {
    ticker: "MKR",
    amount: "3.75",
  },
  {
    ticker: "MANA",
    amount: "10000",
  },
  {
    ticker: "ENS",
    amount: "700",
  },
  {
    ticker: "DYDX",
    amount: "3333",
  },
  {
    ticker: "CRV",
    amount: "10000",
  },
]
