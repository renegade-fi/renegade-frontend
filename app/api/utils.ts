import { encodeFunctionData, hexToBigInt, parseAbi } from "viem"

const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
])

// Helper function to manually encode function data to read balance of token
export async function readErc20BalanceOf(
  rpcUrl: string,
  mint: `0x${string}`,
  owner: `0x${string}`,
): Promise<bigint> {
  try {
    const data = encodeFunctionData({
      abi,
      functionName: "balanceOf",
      args: [owner],
    })

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: mint, data }, "latest"],
      }),
      cache: "no-store",
    })

    const result = await response.json()
    return hexToBigInt(result.result)
  } catch (error) {
    console.error("Error fetching balance", {
      rpcUrl,
      mint,
      owner,
      error,
    })
    return BigInt(0)
  }
}

export async function readEthBalance(
  rpcUrl: string,
  address: string,
): Promise<bigint> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    })

    const result = await response.json()
    return hexToBigInt(result.result)
  } catch (error) {
    console.error("Error reading ETH balance", {
      rpcUrl,
      address,
      error,
    })
    return BigInt(0)
  }
}

export async function readSplBalanceOf(
  rpcUrl: string,
  tokenAddress: string,
  userAddress: string,
): Promise<bigint> {
  try {
    const accountResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          userAddress,
          { mint: tokenAddress },
          { encoding: "jsonParsed" },
        ],
      }),
    })

    const accountData = await accountResponse.json()
    if (!accountData.result?.value?.length) {
      return BigInt(0)
    }

    const tokenAccountAddress = accountData.result.value[0].pubkey
    const balanceResponse = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountBalance",
        params: [tokenAccountAddress],
      }),
    })

    const balanceData = await balanceResponse.json()
    return BigInt(balanceData.result?.value?.amount || "0")
  } catch (error) {
    console.error("Error reading SPL token balance:", error)
    return BigInt(0)
  }
}
