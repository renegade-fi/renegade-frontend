export interface RampEnv {
    renegadeConfig: import("@renegade-fi/react").Config;
    wagmiConfig: import("wagmi").Config;
    connection: import("@solana/web3.js").Connection;
    keychainNonce: bigint;
    currentChain: number;

    // EVM wallet must always be connected
    evmAddress: `0x${string}`;

    // Solana wallet pieces are optional at runtime but always present in type (null when absent)
    solanaAddress: string | null;
    solanaSignTx: ((tx: any) => Promise<any>) | null;
}

export enum ExternalTransferDirection {
    Deposit,
    Withdraw,
}
