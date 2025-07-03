import { getTokenByTicker } from "@/app/rampv2/token-registry/token-registry";

export type IntentKind = "DEPOSIT" | "WITHDRAW";

export class Intent {
    /* ========= raw fields ========= */
    readonly kind!: IntentKind;
    readonly userAddress!: `0x${string}`;
    readonly fromChain!: number;
    readonly toChain!: number;
    readonly fromTicker?: string;
    readonly toTicker!: string;
    readonly amountAtomic!: bigint;

    constructor(params: {
        kind: IntentKind;
        userAddress: `0x${string}`;
        fromChain: number;
        toChain: number;
        fromTicker?: string;
        toTicker: string;
        amountAtomic: bigint;
    }) {
        Object.assign(this, params);
    }

    /* ========= helpers ========= */
    isDeposit() {
        return this.kind === "DEPOSIT";
    }
    isWithdraw() {
        return this.kind === "WITHDRAW";
    }
    sourceTicker(): string {
        return this.fromTicker ?? this.toTicker;
    }
    needsRouting(): boolean {
        return this.fromChain !== this.toChain || this.sourceTicker() !== this.toTicker;
    }

    /** Resolve token address on a chain (falls back to zero address) */
    private tokenAddress(ticker: string, chainId: number): `0x${string}` {
        const token = getTokenByTicker(ticker, chainId);
        return (token?.address ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
    }
    fromTokenAddress(): `0x${string}` {
        return this.tokenAddress(this.sourceTicker(), this.fromChain);
    }
    toTokenAddress(): `0x${string}` {
        return this.tokenAddress(this.toTicker, this.toChain);
    }
}
