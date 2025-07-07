import Image from "next/image";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { getChainLogo, getFormattedChainName } from "@/lib/viem";

interface NetworkLabelProps extends React.HTMLAttributes<HTMLDivElement> {
    chainId: number | undefined;
    showIcon?: boolean;
    iconSize?: number;
}

export function NetworkLabel({
    chainId,
    showIcon = true,
    iconSize = 16,
    className,
    ...props
}: NetworkLabelProps) {
    if (!chainId) {
        return null;
    }
    const logoUrl = getChainLogo(chainId);
    const chainName = getFormattedChainName(chainId);
    let logo;
    if (showIcon) {
        logo = (
            <div
                className={cn("overflow-hidden rounded-full", className)}
                style={{
                    width: iconSize,
                    height: iconSize,
                }}
            >
                <Image alt={chainName} height={iconSize} src={logoUrl} width={iconSize} />
            </div>
        );
    }
    return (
        <div className={cn("flex items-center gap-1", className)} {...props}>
            {logo}
            {getFormattedChainName(chainId)}
        </div>
    );
}
