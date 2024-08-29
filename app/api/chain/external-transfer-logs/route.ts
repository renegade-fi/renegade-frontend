import { NextRequest } from "next/server"
import { createPublicClient, http, parseAbiItem, Block, Log, isAddress, formatUnits } from "viem"
import { chain } from "@/lib/viem"
import { DISPLAY_TOKENS, remapToken } from "@/lib/token"
import { fetchAssetPrice } from "@/app/api/amberdata/helpers"
import { Token } from "@renegade-fi/react"
import { amountTimesPrice } from "@/hooks/use-usd-price"

export const runtime = "edge"

const viemClient = createPublicClient({
  chain,
  transport: http(process.env.RPC_URL),
})

export async function GET(req: NextRequest) {
  try {
    // Get all token prices
    const tokens = DISPLAY_TOKENS()
    const apiKey = process.env.NEXT_PUBLIC_AMBERDATA_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_AMBERDATA_API_KEY is not set");
    }

    const pricePromises = tokens.map(token => fetchAssetPrice(remapToken(token.ticker), apiKey));
    const priceResults = await Promise.all(pricePromises);

    const priceData = tokens.map((token, index) => ({
      ticker: token.ticker,
      price: priceResults[index].payload.price
    }));

    // Get all external transfer logs
    const logs = await viemClient.getLogs({
      address: process.env.NEXT_PUBLIC_DARKPOOL_CONTRACT,
      event: parseAbiItem(
        "event ExternalTransfer(address indexed account, address indexed mint, bool indexed is_withdrawal, uint256 amount)"
      ),
      args: {
        // is_withdrawal: false,
        // TODO: filtering on is_withdrawal does not seem to work
      },
      fromBlock: BigInt(process.env.FROM_BLOCK || 0),
    })

    // Get timestamps for all blocks
    const uniqueBlockNumbers = new Set(logs.map(log => log.blockNumber.toString()))
    const blockPromises = Array.from(uniqueBlockNumbers).map(blockNumber =>
      viemClient.getBlock({ blockNumber: BigInt(blockNumber) })
    )
    const blocks = await Promise.all(blockPromises)
    const blockNumberToTimestamp = new Map<string, bigint>(
      blocks.map(block => [block.number.toString(), block.timestamp])
    )

    const data: ExternalTransferDayData[] = logs.reduce((acc, log) => {
      const mint = log.args.mint?.toString().toLowerCase();
      if (mint && isAddress(mint)) {
        const token = Token.findByAddress(mint);
        const price = priceData.find(tp => tp.ticker === token?.ticker)?.price;
        if (price && token && log.args.amount) {
          const usdVolume = amountTimesPrice(log.args.amount, price)
          const formatted = parseFloat(formatUnits(usdVolume, token.decimals));
          const timestamp = Number(blockNumberToTimestamp.get(log.blockNumber.toString())) * 1000;
          const dayTimestamp = startOfDay(timestamp);
          const isWithdrawal = Boolean(log.args.is_withdrawal);

          const existingDay = acc.find(item => item.timestamp === dayTimestamp.toString());
          if (existingDay) {
            if (isWithdrawal) {
              existingDay.withdrawalAmount += formatted;
            } else {
              existingDay.depositAmount += formatted;
            }
            existingDay.transactions.push({
              timestamp: timestamp.toString(),
              amount: formatted,
              isWithdrawal,
              mint,
            });
          } else {
            acc.push({
              timestamp: dayTimestamp.toString(),
              withdrawalAmount: isWithdrawal ? formatted : 0,
              depositAmount: isWithdrawal ? 0 : formatted,
              transactions: [{
                timestamp: timestamp.toString(),
                amount: formatted,
                isWithdrawal,
                mint,
              }],
            });
          }
        }
      }
      return acc;
    }, [] as ExternalTransferDayData[]);


    return new Response(JSON.stringify({ data } as ExternalTransferResponse))
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export type ExternalTransferTransaction = {
  timestamp: string;
  amount: number;
  isWithdrawal: boolean;
  mint: string;
};

export type ExternalTransferDayData = {
  timestamp: string;
  withdrawalAmount: number;
  depositAmount: number;
  transactions: ExternalTransferTransaction[];
};

export type ExternalTransferResponse = {
  data: ExternalTransferDayData[];
};
