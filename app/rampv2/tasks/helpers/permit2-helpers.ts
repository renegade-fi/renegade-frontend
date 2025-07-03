/**
 * Permit2 helper utilities copied from ramp v1 internal helper.
 */
import type { TypedDataDomain } from "viem";

// Constants
const PERMIT_DEADLINE_MINUTES = 30;
const MILLISECONDS_PER_SECOND = 1000;

function millisecondsToSeconds(milliseconds: number): number {
    return Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
}

/** Token permissions type structure for Permit2. */
export const TOKEN_PERMISSIONS = [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
] as const;

/** Deposit witness type structure for Renegade. */
export const DEPOSIT_WITNESS = [{ name: "pkRoot", type: "uint256[4]" }] as const;

/** Complete type definitions for Permit2 witness transfer. */
export const PERMIT_WITNESS_TRANSFER_FROM_TYPES = {
    PermitWitnessTransferFrom: [
        { name: "permitted", type: "TokenPermissions" },
        { name: "spender", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "witness", type: "DepositWitness" },
    ],
    TokenPermissions: TOKEN_PERMISSIONS,
    DepositWitness: DEPOSIT_WITNESS,
} as const;

/**
 * Construct EIP-712 signing data for Permit2 witness transfer.
 */
export function constructPermit2SigningData({
    chainId,
    permit2Address,
    tokenAddress,
    amount,
    spender,
    pkRoot,
}: {
    chainId: number;
    permit2Address: `0x${string}`;
    tokenAddress: `0x${string}`;
    amount: bigint;
    spender: `0x${string}`;
    pkRoot: readonly [bigint, bigint, bigint, bigint];
}) {
    const domain: TypedDataDomain = {
        name: "Permit2",
        chainId,
        verifyingContract: permit2Address,
    };

    const message = {
        permitted: {
            token: tokenAddress,
            amount,
        },
        spender,
        nonce: BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
        deadline: BigInt(
            millisecondsToSeconds(
                Date.now() + MILLISECONDS_PER_SECOND * 60 * PERMIT_DEADLINE_MINUTES,
            ),
        ),
        witness: { pkRoot },
    } as const;

    return {
        domain,
        message,
        types: PERMIT_WITNESS_TRANSFER_FROM_TYPES,
        primaryType: "PermitWitnessTransferFrom" as const,
    };
}
