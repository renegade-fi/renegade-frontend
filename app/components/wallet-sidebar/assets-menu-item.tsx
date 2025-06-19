import { ChevronRight } from "lucide-react";

import Link from "next/link";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { useAssetsTableData } from "@/hooks/use-assets-table-data";
import { formatCurrency, formatCurrencyFromString } from "@/lib/format";
import { DISPLAY_TOKENS, resolveAddress } from "@/lib/token";
import { useCurrentChain } from "@/providers/state-provider/hooks";

export function AssetsMenuItem() {
    const chainId = useCurrentChain();
    const tokenData = useAssetsTableData({
        mints: DISPLAY_TOKENS({ chainId }).map((token) => token.address),
    });

    const totalRenegadeBalanceUsd = React.useMemo(() => {
        return tokenData.reduce((total, token) => {
            return total + Number(token.renegadeUsdValue);
        }, 0);
    }, [tokenData]);

    return (
        <Collapsible asChild className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Assets">
                        Assets
                        <span className="ml-auto">{formatCurrency(totalRenegadeBalanceUsd)}</span>
                        <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {tokenData
                            .filter((token) => token.renegadeBalance > 0)
                            .sort((a, b) => {
                                return Number(b.renegadeUsdValue) - Number(a.renegadeUsdValue);
                            })
                            .map((token) => {
                                const tokenInfo = resolveAddress(token.mint);
                                return (
                                    <SidebarMenuSubItem key={token.mint}>
                                        <SidebarMenuSubButton asChild>
                                            <Link href={`/trade/${tokenInfo.ticker}`}>
                                                <span>{tokenInfo.ticker}</span>
                                                <span className="ml-auto">
                                                    {formatCurrencyFromString(
                                                        token.renegadeUsdValue,
                                                    )}
                                                </span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                );
                            })}
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild className="text-sidebar-foreground/70">
                                <Link href="/assets">
                                    <span>Go to Assets</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
