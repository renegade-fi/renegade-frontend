import { type Config, getSDKConfig } from "@renegade-fi/react";
import { deposit, getPkRootScalars } from "@renegade-fi/react/actions";
import type { PublicClient, WalletClient } from "viem";
import { erc20Abi } from "@/lib/generated";
import { signPermit2 } from "@/lib/permit2";
import { resolveAddress } from "@/lib/token";

import type { TxStep } from "./models";

/**
 * Executes individual `TxStep`s using viem clients. Currently supports only
 * APPROVE and DEPOSIT for the sandbox deposit flow.
 */
export class EvmStepRunner {
    /**
     * When set to true, the next call to `run` will return a FAILED step.
     * The flag resets to false immediately afterwards. For sandbox testing.
     */
    public shouldFailNext = false;

    constructor(
        private readonly walletClient: WalletClient,
        private readonly publicClient: PublicClient,
        private readonly renegadeConfig: Config,
    ) {}

    async run(step: TxStep): Promise<TxStep> {
        // Failure simulation for sandbox debugging
        if (this.shouldFailNext) {
            this.shouldFailNext = false;
            return { ...step, status: "FAILED" };
        }

        switch (step.type) {
            case "APPROVE":
                return this.handleApprove(step);
            case "DEPOSIT":
                return this.handleDeposit(step);
            default:
                throw new Error(`EvmStepRunner: unsupported step.type ${step.type}`);
        }
    }

    // ---------- private helpers ----------

    private async handleApprove(step: TxStep): Promise<TxStep> {
        console.debug("[RUN/APPROVE]", step);
        const sdkCfg = getSDKConfig(step.chainId);

        // 1. Check current allowance; skip approve if sufficient
        const owner = this.walletClient.account?.address;
        if (!owner) throw new Error("Wallet account not found");

        const currentAllowance = await this.publicClient.readContract({
            abi: erc20Abi,
            address: step.mint,
            functionName: "allowance",
            args: [owner, sdkCfg.permit2Address],
        });
        console.debug("[RUN/APPROVE] currentAllowance", {
            currentAllowance,
            stepAmount: step.amount,
        });

        if (currentAllowance >= step.amount) {
            console.debug(
                "[RUN/APPROVE] skipping, allowance already sufficient:",
                currentAllowance.toString(),
            );
            return {
                ...step,
                status: "CONFIRMED",
            };
        }

        const { request } = await this.publicClient.simulateContract({
            abi: erc20Abi,
            address: step.mint,
            functionName: "approve",
            args: [sdkCfg.permit2Address, step.amount],
            account: this.walletClient.account?.address,
        });

        const hash = await this.walletClient.writeContract(request);

        await this.publicClient.waitForTransactionReceipt({ hash });

        return {
            ...step,
            txHash: hash,
            status: "CONFIRMED",
        };
    }

    private async handleDeposit(step: TxStep): Promise<TxStep> {
        console.debug("[RUN/DEPOSIT]", step);
        const sdkCfg = getSDKConfig(step.chainId);

        // Resolve token metadata (address/decimals) for permit witness
        const token = resolveAddress(step.mint);

        // pkRoot is required for the deposit witness; using nonce = 0 for now.
        const pkRoot = getPkRootScalars(this.renegadeConfig, { nonce: BigInt(0) });

        const { signature, nonce, deadline } = await signPermit2({
            amount: step.amount,
            chainId: step.chainId,
            spender: sdkCfg.darkpoolAddress,
            permit2Address: sdkCfg.permit2Address,
            token,
            walletClient: this.walletClient,
            pkRoot,
        });

        const { taskId } = await deposit(this.renegadeConfig, {
            fromAddr: this.walletClient.account!.address,
            mint: token.address,
            amount: step.amount,
            permitNonce: nonce,
            permitDeadline: deadline,
            permit: signature,
        });

        return {
            ...step,
            status: "CONFIRMED",
            taskId,
        };
    }
}
