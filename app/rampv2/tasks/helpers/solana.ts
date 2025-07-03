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
        skipPreflight: true,
        preflightCommitment: "confirmed",
        maxRetries: 5,
    });
    return signature;
}

/** Await confirmation of a Solana transaction. */
export async function awaitSolanaConfirmation(
    signature: string,
    connection: Connection,
): Promise<void> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    while (true) {
        const status = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
        });
        const info = status.value;
        if (info) {
            if (info.err) throw new Error(`Transaction failed: ${info.err}`);
            if (info.confirmationStatus === "confirmed" || info.confirmationStatus === "finalized")
                return;
        }
        await sleep(500);
    }
}
