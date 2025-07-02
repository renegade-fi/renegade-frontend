import {
    type ExtendedTransactionInfo,
    getStepTransaction,
    type Route,
    type StatusResponse,
} from "@lifi/sdk";
import { sendTransaction } from "wagmi/actions";
import { zeroAddress } from "@/lib/token";
import { Prereq, type StepExecutionContext } from "../types";
import { BaseStep } from "./base-step";

/**
 * Generic step that executes a single leg of a LI.FI route.
 *
 * It defers calldata population until execution time, but can still
 * report its allowance requirement during sequence construction.
 */
export class LiFiLegStep extends BaseStep {
    static override prereqs = [Prereq.APPROVAL];

    private readonly leg: Route["steps"][number];
    private readonly isFinalLeg: boolean;

    constructor(leg: Route["steps"][number], isFinalLeg = false) {
        const chainId = leg.action.fromChainId;
        const mint = leg.action.fromToken.address as `0x${string}`;
        const amount = BigInt(leg.action.fromAmount);
        super(
            crypto.randomUUID(),
            "LIFI_LEG",
            chainId,
            mint,
            amount,
            "PENDING",
            undefined,
            undefined,
            "lifi",
        );
        this.leg = leg;
        this.isFinalLeg = isFinalLeg;
    }

    /**
     * Determine if ERC-20 approval is required for this leg.
     * Uses static information already present in the leg object – no network I/O.
     */
    override async approvalRequirement(): Promise<
        | {
              spender: `0x${string}`;
              amount: bigint;
          }
        | undefined
    > {
        const approvalAddress = this.leg.estimate?.approvalAddress as `0x${string}` | undefined;

        // Native ETH legs (or absence of approval address) do not need ERC-20 approval.
        const LIFI_NATIVE_ETH_SENTINEL =
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as `0x${string}`;

        if (
            !approvalAddress ||
            this.mint.toLowerCase() === zeroAddress.toLowerCase() ||
            this.mint.toLowerCase() === LIFI_NATIVE_ETH_SENTINEL
        ) {
            return undefined;
        }

        const approvalAmount = BigInt(this.leg.action.fromAmount);
        return { spender: approvalAddress, amount: approvalAmount };
    }

    /**
     * Execute the leg: switch chain if necessary, fetch calldata, and submit tx.
     */
    async run(ctx: StepExecutionContext): Promise<void> {
        await this.ensureCorrectChain(ctx);

        // Fetch fresh transaction data for this leg just-in-time.
        const populatedStep = await getStepTransaction(this.leg);
        const txRequest: any = populatedStep?.transactionRequest;
        if (!txRequest) {
            throw new Error("LiFiLegStep: missing transaction request");
        }

        const wagmiConfig = ctx.wagmiConfig;
        const txHash = await sendTransaction(wagmiConfig, { ...txRequest, type: "legacy" } as any);

        this.txHash = txHash;

        // Use centralized await logic
        const statusRes = (await this.awaitCompletion(ctx)) as StatusResponse | undefined;

        // After confirmation, capture final amount if this is last leg
        if (
            this.isFinalLeg &&
            statusRes &&
            statusRes.status === "DONE" &&
            "receiving" in statusRes
        ) {
            // @ts-ignore runtime guard
            const amtStr = (statusRes.receiving as ExtendedTransactionInfo).amount ?? "0";
            ctx.data.lifiFinalAmount = BigInt(amtStr);
        }
    }

    override toJSON(): Record<string, unknown> {
        return { ...super.toJSON(), leg: this.leg, isFinalLeg: this.isFinalLeg };
    }
}
