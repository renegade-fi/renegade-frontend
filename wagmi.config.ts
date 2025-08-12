import { defineConfig } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import { parseAbi } from "viem/utils";

const abi = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
]);

const arbitrumDarkpoolAbi = parseAbi(["function getFee() view returns (uint256)"]);

const baseDarkpoolAbi = parseAbi(["function getProtocolFee() view returns (uint256)"]);

export default defineConfig({
    contracts: [
        {
            abi,
            name: "erc20",
        },
        {
            abi: arbitrumDarkpoolAbi,
            name: "arbitrumDarkpool",
        },
        {
            abi: baseDarkpoolAbi,
            name: "baseDarkpool",
        },
    ],
    out: "lib/generated.ts",
    plugins: [actions()],
});
