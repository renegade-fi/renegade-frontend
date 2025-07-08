import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useQueries } from "@tanstack/react-query";
import * as React from "react";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
    type QueryParams as OnChainBalanceQueryParams,
    onChainBalanceQuery,
} from "../queries/on-chain-balance";
import {
    type QueryParams as RenegadeBalanceQueryParams,
    renegadeBalanceQuery,
} from "../queries/renegade-balance";
import { getTokenByAddress, type Token } from "../token-registry";
import { getSwapPairs } from "../token-registry/registry";
import { ExternalTransferDirection } from "../types";

interface Props {
    direction: ExternalTransferDirection;
    chainId: number;
    onChange: (value: string) => void;
    tokens: Token[];
    value: string;
    isBridge?: boolean;
}

export function TokenSelect({
    owner,
    wagmiConfig,
    direction,
    chainId,
    onChange,
    tokens,
    value,
    connection,
    renegadeConfig,
    isBridge,
}: Props & Omit<OnChainBalanceQueryParams, "mint"> & Omit<RenegadeBalanceQueryParams, "mint">) {
    const [open, setOpen] = React.useState(false);

    const displayTokens = tokens.map((token) => ({
        value: token.address,
        label: token.ticker,
    }));

    const onChainBalances = useQueries({
        queries: displayTokens.map((t) => {
            return {
                ...onChainBalanceQuery({
                    owner,
                    mint: t.value as `0x${string}`,
                    chainId: chainId,
                    wagmiConfig,
                    connection,
                }),
            };
        }),
        combine: (results) => {
            return new Map<`0x${string}`, bigint>(
                displayTokens.map((t, i) => [
                    t.value as `0x${string}`,
                    results[i].data?.raw ?? BigInt(0),
                ]),
            );
        },
    });

    // Construct Map<address, balance> for balances to add
    // For deposit, this is balances of tokens that can swap into the selected token
    // For bridge, this is balances of tokens that can be bridged from the selected token
    const swapPairs = getSwapPairs(chainId).filter(([a]) => a.ticker !== "USDT");
    const additionalBalances = useQueries({
        queries: swapPairs.map(([a, b]) => {
            return {
                ...onChainBalanceQuery({
                    owner,
                    mint: a.address as `0x${string}`,
                    chainId: chainId,
                    wagmiConfig,
                    connection,
                }),
                enabled: !isBridge,
            };
        }),
        combine: (results) => {
            // Aggregate balances so that multiple swap-from tokens mapping to the same
            // swap-to token get summed rather than overwritten.
            const map = new Map<`0x${string}`, bigint>();
            swapPairs.forEach(([a, b], i) => {
                const key = b.address as `0x${string}`;
                const existing = map.get(key) ?? BigInt(0);
                const value = results[i].data?.raw ?? BigInt(0);
                map.set(key, existing + value);
            });
            return map;
        },
    });

    const renegadeBalances = useQueries({
        queries: displayTokens.map((t) => {
            return {
                ...renegadeBalanceQuery({
                    mint: t.value as `0x${string}`,
                    renegadeConfig,
                }),
            };
        }),
        combine: (results) => {
            return new Map<`0x${string}`, bigint>(
                displayTokens.map((t, i) => [
                    t.value as `0x${string}`,
                    results[i].data?.raw ?? BigInt(0),
                ]),
            );
        },
    });
    const displayBalances =
        direction === ExternalTransferDirection.Deposit ? onChainBalances : renegadeBalances;

    // When depositing, show on-chain balance **plus** any swap-in balances so the user
    // sees their true available amount. Memoised to avoid recalculation every render.
    const totalDepositBalances = React.useMemo(() => {
        if (direction !== ExternalTransferDirection.Deposit) return displayBalances;
        const map = new Map(displayBalances);
        additionalBalances?.forEach((value, key) => {
            map.set(key, (map.get(key) ?? BigInt(0)) + value);
        });
        return map;
    }, [direction, displayBalances, additionalBalances]);

    const getDisplayBalance = React.useCallback(
        (addr: `0x${string}`) => totalDepositBalances?.get(addr) ?? BigInt(0),
        [totalDepositBalances],
    );

    const isDesktop = !useIsMobile();

    return (
        <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    autoFocus
                    aria-expanded={open}
                    className={cn("justify-between px-3", !value && "text-muted-foreground")}
                    role="combobox"
                    variant="outline"
                >
                    {value ? displayTokens.find((t) => t.value === value)?.label : "Select token"}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                onOpenAutoFocus={(e) => (!isDesktop ? e.preventDefault() : undefined)}
            >
                <Command
                    filter={(value, search) => {
                        if (!isAddress(value)) return 0;
                        const token = getTokenByAddress(value, chainId);
                        if (!token) return 0;
                        if (
                            token.name.toLowerCase().includes(search.toLowerCase()) ||
                            token.ticker.toLowerCase().includes(search.toLowerCase())
                        )
                            return 1;
                        return 0;
                    }}
                >
                    <CommandInput className="h-9" placeholder="Search for token..." />
                    <CommandList>
                        <CommandEmpty>No token found.</CommandEmpty>
                        <CommandGroup>
                            {displayTokens.map((t) => (
                                <CommandItem
                                    key={t.value}
                                    value={t.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="flex-1">{t.label}</span>
                                    <span className="flex-1 pr-2 text-right">
                                        {formatNumber(
                                            getDisplayBalance(t.value as `0x${string}`),
                                            getTokenByAddress(t.value, chainId)?.decimals ?? 0,
                                        )}
                                    </span>
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === t.value ? "opacity-100" : "opacity-0",
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
