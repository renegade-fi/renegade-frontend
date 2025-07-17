import { getSDKConfig } from "@renegade-fi/react";
import { kv } from "@vercel/kv";
import type { NextRequest } from "next/server";
import { formatUnits } from "viem";

import { type AlchemyTransfer, getAssetTransfers } from "@/app/api/alchemy-transfers";
import {
    type ExternalTransferData,
    getInflowsKey,
    getInflowsSetKey,
    getLastProcessedBlockKey,
} from "@/app/api/stats/constants";

import { amountTimesPrice } from "@/hooks/use-usd-price";
import { client } from "@/lib/clients/price-reporter";
import { DISPLAY_TOKENS, resolveAddress } from "@/lib/token";
import { getDeployBlock } from "@/lib/viem";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
    console.log("Starting POST request: set-inflow-kv");
    // Parse and validate chainId
    const chainIdParam = req.nextUrl.searchParams.get("chainId");
    const chainId = Number(chainIdParam);
    if (Number.isNaN(chainId)) {
        return new Response(JSON.stringify({ error: `Invalid chainId: ${chainIdParam}` }), {
            status: 400,
        });
    }
    // Build dynamic clients and keys
    const sdkConfig = getSDKConfig(chainId);
    const inflowsKey = getInflowsKey(chainId);
    const inflowsSetKey = getInflowsSetKey(chainId);
    const lastProcessedBlockKey = getLastProcessedBlockKey(chainId);
    try {
        // Get all token prices
        console.log("Fetching token prices");
        const tokens = DISPLAY_TOKENS({ chainId });

        const pricePromises = tokens.map((token) => client.getPrice(token.address));
        const priceResults = await Promise.all(pricePromises);

        const priceData = tokens.map((token, index) => ({
            price: priceResults[index],
            ticker: token.ticker,
        }));
        console.log(`Fetched prices for ${priceData.length} tokens`);

        // Get the last processed block number
        const deployBlock = getDeployBlock(chainId) ?? BigInt(0);
        const lastProcessedFromKV = await kv.get(lastProcessedBlockKey);
        const fromBlock = lastProcessedFromKV ? BigInt(Number(lastProcessedFromKV)) : deployBlock;
        console.log(`Starting from block: ${fromBlock}`);

        // Get external transfer logs
        console.log("Fetching external transfer logs", sdkConfig.darkpoolAddress);
        const [depositTransfers, withdrawTransfers] = await Promise.all([
            getAssetTransfers({
                chainId,
                fromBlock,
                isWithdrawal: false,
            }),
            getAssetTransfers({
                chainId,
                fromBlock,
                isWithdrawal: true,
            }),
        ]);
        const rawTransfers: AlchemyTransfer[] = [...depositTransfers, ...withdrawTransfers];
        if (rawTransfers.length === 0) {
            console.log("No new transfers to process");
            return new Response(JSON.stringify({ message: "No new transfers to process" }));
        }
        console.log(`Fetched ${rawTransfers.length} transfers from Alchemy`);
        // Process all raw transfers
        console.log("Processing transfers");
        const processPromises = rawTransfers.map(async (raw) => {
            const mint = raw.rawContract.address as `0x${string}`;
            const token = resolveAddress(mint);
            const price = priceData.find((tp) => tp.ticker === token.ticker)?.price;
            if (!price) return null;

            const rawAmount = BigInt(raw.rawContract.value);
            const usdVolumeBigInt = amountTimesPrice(rawAmount, price);
            const amount = parseFloat(formatUnits(usdVolumeBigInt, token.decimals));

            const timestamp = new Date(raw.metadata.blockTimestamp).getTime();

            const isWithdrawal = raw.from.toLowerCase() === sdkConfig.darkpoolAddress.toLowerCase();

            const data: ExternalTransferData = {
                amount,
                isWithdrawal,
                mint,
                timestamp,
                transactionHash: raw.hash,
            };

            await Promise.all([
                kv.set(`${inflowsKey}:${raw.hash}`, JSON.stringify(data)),
                kv.sadd(inflowsSetKey, raw.hash),
            ]);
            return data;
        });

        const results = await Promise.all(processPromises);
        const processedResults = results.filter(
            (result): result is ExternalTransferData => result !== null,
        );
        console.log(`Successfully processed ${processedResults.length} logs`);

        // Store the last processed block number
        const lastProcessedBlock = rawTransfers
            .map((r) => BigInt(r.blockNum))
            .reduce((max, b) => (b > max ? b : max), BigInt(0));
        await kv.set(lastProcessedBlockKey, lastProcessedBlock.toString());
        console.log(`Updated last processed block to ${lastProcessedBlock}`);

        console.log("POST request completed successfully");
        return new Response(
            JSON.stringify({
                lastProcessedBlock: lastProcessedBlock.toString(),
                message: `Processed ${processedResults.length} logs`,
            }),
            { status: 200 },
        );
    } catch (error) {
        console.error("Error in POST request:", error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
        });
    }
}
