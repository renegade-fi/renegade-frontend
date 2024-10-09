import { defineConfig } from "@wagmi/cli"
import { actions, react } from "@wagmi/cli/plugins"
import { parseAbi } from "viem/utils"

const abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
])

const wethAbi = parseAbi([
  "function deposit() payable",
  "function withdraw(uint256 wad) public",
])

export default defineConfig({
  out: "lib/generated.ts",
  contracts: [
    {
      name: "erc20",
      abi,
    },
    {
      name: "weth",
      abi: wethAbi,
    },
  ],
  plugins: [actions(), react()],
})
