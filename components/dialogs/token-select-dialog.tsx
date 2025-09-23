import { Star } from "lucide-react";

import Link from "next/link";
import * as React from "react";
import { useDebounceValue } from "usehooks-ts";
import { fromHex } from "viem/utils";

import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useBackOfQueueWallet } from "@/hooks/query/use-back-of-queue-wallet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatNumber } from "@/lib/format";
import { getAllBaseTokens } from "@/lib/token";
import { useClientStore } from "@/providers/state-provider/client-store-provider";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function TokenSelectDialog({
    children,
    mint,
}: {
    children: React.ReactNode;
    mint: `0x${string}`;
}) {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
    const isDesktop = useMediaQuery("(min-width: 1024px)");

    if (isDesktop) {
        return (
            <Dialog onOpenChange={setOpen} open={open}>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="max-h-[70vh] p-0 sm:max-w-[425px]">
                    <DialogHeader className="space-y-4 px-6 pt-6">
                        <DialogTitle className="font-extended">Select Token</DialogTitle>
                        <DialogDescription>
                            <Input
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search tokens"
                                value={searchTerm}
                            />
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[50vh] min-h-[50vh]">
                        <TokenList
                            enabled={open}
                            mint={mint}
                            onClose={() => setOpen(false)}
                            searchTerm={debouncedSearchTerm}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent
                className="h-dvh gap-0 p-0"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader className="mt-6 space-y-4 px-6 text-left">
                    <DialogTitle>Select Token</DialogTitle>
                    <DialogDescription>
                        <Input
                            autoFocus={false}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search tokens"
                            value={searchTerm}
                        />
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(100dvh-158px)]">
                    <TokenList
                        enabled={open}
                        mint={mint}
                        onClose={() => setOpen(false)}
                        searchTerm={debouncedSearchTerm}
                    />
                </ScrollArea>
                <DialogFooter className="p-6 pt-0">
                    <DialogClose asChild>
                        <Button className="font-extended text-lg" size="xl" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TokenList({
    enabled,
    searchTerm,
    onClose,
    mint,
}: {
    enabled: boolean;
    searchTerm: string;
    onClose: () => void;
    mint: `0x${string}`;
}) {
    const { data, status } = useBackOfQueueWallet({
        query: {
            enabled,
            select: (data) =>
                new Map(
                    data.balances
                        .filter((balance) => !!fromHex(balance.mint, "number"))
                        .map((balance) => [balance.mint, balance.amount]),
                ),
        },
    });

    const favorites = useClientStore((s) => s.favorites);
    const setFavorites = useClientStore((s) => s.setFavorites);

    const chainId = useCurrentChain();
    const processedTokens = React.useMemo(() => {
        const allTokens = getAllBaseTokens(chainId);
        return allTokens
            .sort((a, b) => {
                const balanceA = data?.get(a.address) ?? BigInt(0);
                const balanceB = data?.get(b.address) ?? BigInt(0);
                const isAFavorite = favorites.includes(a.address);
                const isBFavorite = favorites.includes(b.address);

                // Prioritize favorites
                if (isAFavorite && !isBFavorite) return -1;
                if (!isAFavorite && isBFavorite) return 1;

                // If both are favorites or both are not favorites, prioritize non-zero balances
                if (balanceA !== BigInt(0) && balanceB === BigInt(0)) return -1;
                if (balanceA === BigInt(0) && balanceB !== BigInt(0)) return 1;

                // If both have the same favorite status and balance status, maintain original order
                return 0;
            })
            .filter(
                (token) =>
                    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    token.ticker.toLowerCase().includes(searchTerm.toLowerCase()),
            );
    }, [chainId, data, favorites, searchTerm]);

    return (
        <div className="grid items-start">
            {processedTokens.length ? (
                processedTokens.map((token) => {
                    const balance = data?.get(token.address);
                    const formattedBalance =
                        status === "pending"
                            ? "--"
                            : formatNumber(balance ?? BigInt(0), token.decimals, true);
                    return (
                        <Link
                            className="flex items-center gap-4 px-6 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
                            href={`/trade/${token.ticker}`}
                            key={token.address}
                            onClick={() => {
                                if (token.address === mint) onClose();
                            }}
                        >
                            <div className="grid w-full grid-cols-[32px_2fr_1fr] items-center gap-4">
                                <TokenIcon ticker={token.ticker} />
                                <div>
                                    <p className="text-md font-medium">{token.name}</p>
                                    <p className="text-xs text-muted-foreground">{token.ticker}</p>
                                </div>
                                <div className="justify-self-end font-mono">{formattedBalance}</div>
                            </div>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (favorites.includes(token.address)) {
                                        setFavorites(
                                            favorites.filter(
                                                (address) => address !== token.address,
                                            ),
                                        );
                                    } else {
                                        setFavorites([...favorites, token.address]);
                                    }
                                }}
                                size="icon"
                                variant="ghost"
                            >
                                <Star
                                    className="h-4 w-4"
                                    fill={favorites.includes(token.address) ? "white" : "none"}
                                />
                            </Button>
                        </Link>
                    );
                })
            ) : (
                <div className="px-6 py-2 text-center">No results found.</div>
            )}
        </div>
    );
}
