import { Star } from "lucide-react";
import Link from "next/link";
import { isAddress } from "viem/utils";

import { AnimatedPrice } from "@/components/animated-price";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { resolveAddress } from "@/lib/token";
import { useClientStore } from "@/providers/state-provider/client-store-provider";

export function FavoritesBanner() {
    const favorites = useClientStore((s) => s.favorites);
    if (!favorites || !favorites.length) return null;
    return (
        <div className="hidden min-h-marquee overflow-hidden lg:block">
            <ScrollArea className="w-full whitespace-nowrap border-t bg-background font-extended text-sm">
                <div className="flex w-max items-center gap-8 p-2">
                    <div className="pl-4 text-muted-foreground">
                        <Star className="h-3 w-3" />
                    </div>
                    {favorites.map((address, index) => {
                        if (!isAddress(address)) return null;
                        const token = resolveAddress(address);
                        return (
                            <div className="flex items-center gap-8" key={address}>
                                <Link href={`/trade/${token.ticker}`}>
                                    <span className="space-x-4">
                                        <span>{token.ticker}</span>
                                        <AnimatedPrice mint={address} />
                                    </span>
                                </Link>
                                {index < favorites.length - 1 && <span className="text-xs">•</span>}
                            </div>
                        );
                    })}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
