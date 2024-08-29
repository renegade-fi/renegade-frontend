import { amountTimesPrice } from '@/hooks/use-usd-price';
import React from 'react';
import { useTokenPrices } from './use-all-prices';
import { useTvlData } from './use-tvl';
import { Token } from '@renegade-fi/react';
import { formatUnits } from 'viem/utils';

export function useCumulativeTvlUsd() {
    const { data: tvlData, } = useTvlData();
    const { data: tokenPrices } = useTokenPrices();

    const cumulativeTvlUsd = React.useMemo(() => {
        if (!tvlData || !tokenPrices) return 0;

        let totalTvlUsd = 0;
        for (const tvl of tvlData) {
            const price = tokenPrices.find(tp => tp.ticker === tvl.ticker)?.price;
            const token = Token.findByTicker(tvl.ticker);
            if (price && token) {
                const usd = amountTimesPrice(tvl.tvl, price);
                const formatted = Number(formatUnits(usd, token.decimals))
                totalTvlUsd += formatted;
            } else {
                console.error(`Price not found for token: ${tvl.ticker}`);
            }
        }

        return totalTvlUsd;
    }, [tokenPrices, tvlData])
    return { cumulativeTvlUsd }
}
