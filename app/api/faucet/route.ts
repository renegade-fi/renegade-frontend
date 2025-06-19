import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseAbi,
  parseEther,
  parseUnits,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { arbitrumSepolia } from "viem/chains"
import { createConfig } from "wagmi"

import { env } from "@/env/server"
import { readErc20BalanceOf } from "@/lib/generated"
import { resolveAddress, resolveTickerAndChain } from "@/lib/token"

export const maxDuration = 300

// The cost of 20 approval transactions
const APPROVAL_COST = parseEther("0.00019214") * BigInt(20)

const abi = parseAbi([
  "function mint(address _address, uint256 value) external",
])

const viemConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(),
  },
})

// Account to fund ETH from
const devAccount = privateKeyToAccount(env.DEV_PRIVATE_KEY!)
const devWalletClient = createWalletClient({
  account: devAccount,
  chain: arbitrumSepolia,
  transport: http(),
})

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const chainId = body.chainId
  if (chainId !== arbitrumSepolia.id) {
    return new Response("Faucet is not available on this chain", {
      status: 403,
    })
  }
  if (!env.DEV_PRIVATE_KEY) {
    return new Response("DEV_PRIVATE_KEY is required", {
      status: 500,
    })
  }

  const TOKENS_TO_FUND = body.tokens as {
    ticker: string
    amount: string
  }[]

  if (!TOKENS_TO_FUND || !TOKENS_TO_FUND.length) {
    return new Response("Tokens are required", {
      status: 500,
    })
  }

  const recipient = body.address as `0x${string}`
  if (!recipient) {
    return new Response("Recipient address is required", {
      status: 500,
    })
  }

  try {
    await fundEth(recipient, APPROVAL_COST)

    // Loop through each token in TOKENS_TO_FUND and mint them
    for (const { ticker, amount } of TOKENS_TO_FUND) {
      const token = resolveTickerAndChain(ticker, chainId)
      if (!token) {
        return new Response(`Token ${ticker} not found`, {
          status: 500,
        })
      }
      await mintUpTo(
        recipient,
        token.address,
        parseUnits(amount, token.decimals),
      )
    }

    return new Response("Funding successful", { status: 200 })
  } catch (error) {
    return new Response(`Error funding ${recipient}: ${error}`, {
      status: 500,
    })
  }
}

async function fundEth(
  recipient: `0x${string}`,
  amount: bigint,
): Promise<void> {
  const ethBalance = await publicClient.getBalance({
    address: recipient,
  })
  const amountToSend = amount - ethBalance
  if (amountToSend <= 0) {
    console.log("Skipping ETH funding")
    return
  }

  let attempts = 0
  while (attempts < 5) {
    try {
      const hash = await devWalletClient.sendTransaction({
        to: recipient,
        value: amountToSend,
      })

      await publicClient.waitForTransactionReceipt({
        hash,
      })

      console.log(`Funded ${recipient} with ${formatEther(amountToSend)} ETH.`)
      break
    } catch (error: any) {
      if (error?.message?.includes("nonce")) {
        attempts++
        console.log(`Nonce error, retrying... Attempt ${attempts}`)
        continue
      } else {
        throw error
      }
    }
  }
}

async function mintUpTo(
  recipientAddr: `0x${string}`,
  token: `0x${string}`,
  amount: bigint,
) {
  const balance = await readErc20BalanceOf(viemConfig, {
    address: token,
    args: [recipientAddr],
  })
  const mintAmount = amount - balance
  if (mintAmount > 0) {
    let attempts = 0
    while (attempts < 5) {
      try {
        return await mint(recipientAddr, token, mintAmount)
      } catch (error: any) {
        if (error?.message?.includes("nonce")) {
          attempts++
          console.log(`Nonce error, retrying... Attempt ${attempts}`)
          continue
        } else {
          throw error
        }
      }
    }
  } else {
    console.log(
      `No minting needed for ${
        resolveAddress(token).ticker
      } for address ${recipientAddr}`,
    )
  }
}

async function mint(
  recipientAddr: `0x${string}`,
  token: `0x${string}`,
  amount: bigint,
) {
  const { request } = await publicClient.simulateContract({
    account: devAccount,
    address: token,
    abi,
    functionName: "mint",
    args: [recipientAddr, amount],
  })

  const hash = await devWalletClient.writeContract(request)
  const tx = await publicClient.waitForTransactionReceipt({
    hash,
  })
  if (tx.status === "success") {
    console.log(
      `Minted ${formatEther(amount)} ${
        resolveAddress(token).ticker
      } for address ${recipientAddr}`,
    )
  } else {
    console.log(
      `Failed to mint ${formatEther(amount)} ${
        resolveAddress(token).ticker
      } for address ${recipientAddr}`,
    )
  }
  return tx
}
