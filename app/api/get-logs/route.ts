import { getSDKConfig } from "@renegade-fi/react";
import type { NextRequest } from "next/server";
import { encodeEventTopics, parseAbiItem, toHex } from "viem";

import { getAlchemyRpcUrl } from "@/app/api/utils";

import { getDeployBlock } from "@/lib/viem";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    const chainIdParam = req.nextUrl.searchParams.get("chainId");
    const chainId = Number(chainIdParam);
    if (Number.isNaN(chainId)) {
        return new Response(JSON.stringify({ error: `Invalid chainId: ${chainIdParam}` }), {
            status: 400,
        });
    }

    const blinderParam = req.nextUrl.searchParams.get("blinderShare");
    const blinderShare = BigInt(blinderParam || "0");
    if (blinderShare === BigInt(0)) {
        return new Response(JSON.stringify({ error: `Invalid blinderShare: ${blinderParam}` }), {
            status: 400,
        });
    }

    try {
        const deployBlock = getDeployBlock(chainId) ?? BigInt(0);
        const deployBlockHex = toHex(deployBlock);
        const darkpool = getSDKConfig(chainId).darkpoolAddress;
        const rpcUrl = getAlchemyRpcUrl(chainId);

        const topics = encodeEventTopics({
            abi: [parseAbiItem("event WalletUpdated(uint256 indexed wallet_blinder_share)")],
            args: {
                wallet_blinder_share: blinderShare,
            },
        });

        // Make raw JSON-RPC call
        const response = await fetch(rpcUrl, {
            body: JSON.stringify({
                id: 1,
                jsonrpc: "2.0",
                method: "eth_getLogs",
                params: [
                    {
                        address: darkpool,
                        fromBlock: deployBlockHex,
                        topics,
                    },
                ],
            }),
            headers: { "Content-Type": "application/json" },
            method: "POST",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch logs because ${response.statusText}`);
        }

        const result = await response.json();
        if (result.error) {
            throw new Error(`RPC error: ${result.error.message}`);
        }

        return new Response(JSON.stringify({ logs: result.result.length }));
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error }), { status: 500 });
    }
}
