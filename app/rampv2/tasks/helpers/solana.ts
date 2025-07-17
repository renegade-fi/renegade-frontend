import type { TransactionRequest } from "@lifi/sdk";
import { type Connection, VersionedTransaction } from "@solana/web3.js";

/** Submit a Solana transaction produced by LiFi */
export async function sendSolanaTransaction(
    request: TransactionRequest,
    connection: Connection,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
): Promise<string> {
    if (!request?.data) throw new Error("Transaction request data is missing");
    const serialized = Buffer.from(request.data as string, "base64");
    const tx = VersionedTransaction.deserialize(serialized);
    const signed = await signTransaction(tx);
    const signature = await connection.sendRawTransaction(signed.serialize(), {
        maxRetries: 5,
        preflightCommitment: "confirmed",
        skipPreflight: true,
    });
    return signature;
}
