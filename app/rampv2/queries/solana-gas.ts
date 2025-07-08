import type { TransactionRequest } from "@lifi/sdk";
import type { Connection } from "@solana/web3.js";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { queryOptions } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { formatNumber } from "@/lib/format";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export interface SolanaQueryBase {
    connection: Connection;
    payer: string; // base58 address
}

export interface SolanaBalanceQueryParams extends SolanaQueryBase {}

export interface SolanaFeeQueryParams extends SolanaQueryBase {
    transactionRequest?: TransactionRequest;
}

// -----------------------------------------------------------------------------
// Balance query
// -----------------------------------------------------------------------------
export function solBalanceQuery(params: SolanaBalanceQueryParams) {
    return queryOptions({
        queryKey: ["sol-balance", { payer: params.payer }],
        queryFn: async () => {
            const key = new PublicKey(params.payer);
            const lamports = await params.connection.getBalance(key, "confirmed");
            return BigInt(lamports);
        },
        select: (raw: bigint) => {
            const decimalCorrected = formatUnits(raw, 9); // SOL has 9 decimals
            const rounded = formatNumber(raw, 9);
            return { raw, decimalCorrected, rounded, ticker: "SOL" } as const;
        },
        staleTime: 5000,
    });
}

// -----------------------------------------------------------------------------
// Fee estimation query for a LiFi transactionRequest (base64 data string)
// -----------------------------------------------------------------------------
export function solFeeQuery(params: SolanaFeeQueryParams) {
    return queryOptions({
        queryKey: [
            "sol-fee",
            {
                payer: params.payer,
                txData: params.transactionRequest?.data,
            },
        ],
        queryFn: async () => {
            if (!params.transactionRequest?.data)
                throw new Error("transactionRequest.data missing");
            // Deserialize
            const serialized = Buffer.from(
                params.transactionRequest?.data as string,
                "base64",
            ) as unknown as Uint8Array;
            const tx = VersionedTransaction.deserialize(serialized);

            // Refresh blockhash
            const { blockhash } = await params.connection.getLatestBlockhash("finalized");
            tx.message.recentBlockhash = blockhash;

            // Estimate fee
            const { value: lamports } = await params.connection.getFeeForMessage(tx.message);
            return BigInt(lamports ?? 0);
        },
        select: (raw: bigint) => {
            const decimalCorrected = formatUnits(raw, 9);
            const rounded = formatNumber(raw, 9);
            return { raw, decimalCorrected, rounded, ticker: "SOL" } as const;
        },
        staleTime: 0,
    });
}
