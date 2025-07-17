import { defineConfig } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import { parseAbi } from "viem/utils";

const abi = parseAbi([
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
]);

export default defineConfig({
    contracts: [
        {
            abi,
            name: "erc20",
        },
    ],
    out: "lib/generated.ts",
    plugins: [actions()],
});
