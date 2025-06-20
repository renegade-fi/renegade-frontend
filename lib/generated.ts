import {
    createReadContract,
    createSimulateContract,
    createUseReadContract,
    createUseSimulateContract,
    createUseWriteContract,
    createWriteContract,
} from "wagmi/codegen";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// erc20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
    {
        type: "function",
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ type: "bool" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
    },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// weth
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const wethAbi = [
    {
        type: "function",
        inputs: [],
        name: "deposit",
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        inputs: [{ name: "wad", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
    },
] as const;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const readErc20 = /*#__PURE__*/ createReadContract({ abi: erc20Abi });

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const readErc20BalanceOf = /*#__PURE__*/ createReadContract({
    abi: erc20Abi,
    functionName: "balanceOf",
});

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const readErc20Allowance = /*#__PURE__*/ createReadContract({
    abi: erc20Abi,
    functionName: "allowance",
});

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const writeErc20 = /*#__PURE__*/ createWriteContract({ abi: erc20Abi });

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const writeErc20Approve = /*#__PURE__*/ createWriteContract({
    abi: erc20Abi,
    functionName: "approve",
});

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const simulateErc20 = /*#__PURE__*/ createSimulateContract({
    abi: erc20Abi,
});

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const simulateErc20Approve = /*#__PURE__*/ createSimulateContract({
    abi: erc20Abi,
    functionName: "approve",
});

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link wethAbi}__
 */
export const writeWeth = /*#__PURE__*/ createWriteContract({ abi: wethAbi });

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"deposit"`
 */
export const writeWethDeposit = /*#__PURE__*/ createWriteContract({
    abi: wethAbi,
    functionName: "deposit",
});

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"withdraw"`
 */
export const writeWethWithdraw = /*#__PURE__*/ createWriteContract({
    abi: wethAbi,
    functionName: "withdraw",
});

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link wethAbi}__
 */
export const simulateWeth = /*#__PURE__*/ createSimulateContract({
    abi: wethAbi,
});

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"deposit"`
 */
export const simulateWethDeposit = /*#__PURE__*/ createSimulateContract({
    abi: wethAbi,
    functionName: "deposit",
});

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"withdraw"`
 */
export const simulateWethWithdraw = /*#__PURE__*/ createSimulateContract({
    abi: wethAbi,
    functionName: "withdraw",
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useReadErc20 = /*#__PURE__*/ createUseReadContract({
    abi: erc20Abi,
});

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20BalanceOf = /*#__PURE__*/ createUseReadContract({
    abi: erc20Abi,
    functionName: "balanceOf",
});

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20Allowance = /*#__PURE__*/ createUseReadContract({
    abi: erc20Abi,
    functionName: "allowance",
});

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWriteErc20 = /*#__PURE__*/ createUseWriteContract({
    abi: erc20Abi,
});

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20Approve = /*#__PURE__*/ createUseWriteContract({
    abi: erc20Abi,
    functionName: "approve",
});

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useSimulateErc20 = /*#__PURE__*/ createUseSimulateContract({
    abi: erc20Abi,
});

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20Approve = /*#__PURE__*/ createUseSimulateContract({
    abi: erc20Abi,
    functionName: "approve",
});

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wethAbi}__
 */
export const useWriteWeth = /*#__PURE__*/ createUseWriteContract({
    abi: wethAbi,
});

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"deposit"`
 */
export const useWriteWethDeposit = /*#__PURE__*/ createUseWriteContract({
    abi: wethAbi,
    functionName: "deposit",
});

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteWethWithdraw = /*#__PURE__*/ createUseWriteContract({
    abi: wethAbi,
    functionName: "withdraw",
});

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wethAbi}__
 */
export const useSimulateWeth = /*#__PURE__*/ createUseSimulateContract({
    abi: wethAbi,
});

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"deposit"`
 */
export const useSimulateWethDeposit = /*#__PURE__*/ createUseSimulateContract({
    abi: wethAbi,
    functionName: "deposit",
});

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link wethAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateWethWithdraw = /*#__PURE__*/ createUseSimulateContract({
    abi: wethAbi,
    functionName: "withdraw",
});
