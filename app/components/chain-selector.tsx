import { CheckIcon } from "@radix-ui/react-icons";
import type { ChainId } from "@renegade-fi/react/constants";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { env } from "@/env/client";
import { isAddressMultiChain } from "@/lib/token";
import { cn } from "@/lib/utils";
import { useCurrentChain } from "@/providers/state-provider/hooks";
import { useServerStore } from "@/providers/state-provider/server-store-provider";
import { MAINNET_CHAINS, TESTNET_CHAINS } from "@/providers/wagmi-provider/config";

const values = (
    env.NEXT_PUBLIC_CHAIN_ENVIRONMENT === "mainnet" ? MAINNET_CHAINS : TESTNET_CHAINS
).map((chain) => ({
    icon: `/${chain.name.split(" ")[0].toLowerCase()}.svg`,
    label: chain.name.split(" ")[0],
    value: chain.id,
}));

export function ChainSelector() {
    const [open, setOpen] = React.useState(false);
    const currentChainId = useCurrentChain();
    const setChainId = useServerStore((s) => s.setChainId);
    const { switchChain } = useSwitchChain();
    const baseMint = useServerStore((s) => s.baseMint);
    const router = useRouter();
    const pathname = usePathname();

    /**
     * Handles chain selection with dual strategy:
     * - Multichain tokens: Switch chain directly (no navigation needed)
     * - Single-chain tokens: Navigate to WETH with chain parameter to avoid
     *   mismatch modals between token chain and app chain state
     */
    const handleChainSelect = (chainValue: string) => {
        const chainId = Number.parseInt(chainValue) as ChainId;
        const isMultiChain = isAddressMultiChain(baseMint);
        const isTradePage = pathname.startsWith("/trade");

        if (!isMultiChain && isTradePage) {
            // Navigate to WETH (universal fallback) with chain parameter if on trade page
            router.push(`/trade/WETH?c=${chainId}`);
        } else {
            // Safe to switch directly - token exists on target chain
            switchChain({ chainId });
            setChainId(chainId);
        }

        setOpen(false);
    };

    const currentChain = values.find((v) => v.value === currentChainId);

    return (
        <Popover modal onOpenChange={setOpen} open={open}>
            <PopoverTrigger asChild>
                <Button
                    aria-expanded={open}
                    className="justify-between"
                    role="combobox"
                    size="default"
                    variant="outline"
                >
                    <Image
                        alt={currentChain?.label ?? ""}
                        className="mr-2 h-4 w-4 shrink-0"
                        height={16}
                        src={currentChain?.icon ?? ""}
                        width={16}
                    />
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out",
                            open && "rotate-180",
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="min-w-48 p-0">
                <Command>
                    <CommandList>
                        <CommandGroup>
                            {values.map((chain) => (
                                <CommandItem
                                    className="flex items-center gap-2"
                                    key={chain.value}
                                    onSelect={handleChainSelect}
                                    value={chain.value.toString()}
                                >
                                    <Image
                                        alt={chain.label}
                                        height={16}
                                        src={chain.icon}
                                        width={16}
                                    />
                                    <span className="flex-1">{chain.label}</span>
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            currentChainId === chain.value
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
