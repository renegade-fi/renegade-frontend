import type { getRoutes } from "@lifi/sdk";

export type IntentKind = "DEPOSIT" | "WITHDRAW";

export class Intent {
    /* ========= raw fields ========= */
    readonly kind!: IntentKind;
    readonly fromChain!: number;
    readonly toChain!: number;
    readonly fromTokenAddress!: string;
    readonly toTokenAddress!: string;
    readonly amountAtomic!: bigint;
    readonly fromAddress!: string;
    readonly toAddress!: string;

    constructor(params: {
        kind: IntentKind;
        fromChain: number;
        fromAddress: string;
        fromTokenAddress: string;
        toChain: number;
        toAddress: string;
        toTokenAddress: string;
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
    needsRouting(): boolean {
        return this.fromChain !== this.toChain || this.fromTokenAddress !== this.toTokenAddress;
    }

    toJson() {
        return {
            kind: this.kind,
            fromChain: this.fromChain,
            fromAddress: this.fromAddress,
            fromTokenAddress: this.fromTokenAddress,
            toChain: this.toChain,
            toAddress: this.toAddress,
            toTokenAddress: this.toTokenAddress,
            amountAtomic: this.amountAtomic.toString(),
        };
    }

    toLifiRouteRequest(): Parameters<typeof getRoutes>[0] {
        return {
            fromChainId: this.fromChain,
            toChainId: this.toChain,
            fromAmount: this.amountAtomic.toString(),
            fromTokenAddress: this.fromTokenAddress,
            toTokenAddress: this.toTokenAddress,
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
        };
    }
}
