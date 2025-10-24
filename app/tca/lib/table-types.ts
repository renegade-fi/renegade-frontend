export type TwapTableMeta = {
    direction: "Buy" | "Sell";
    sendTicker: string; // e.g., USDC when Buy, BASE when Sell
    receiveTicker: string; // e.g., BASE when Buy, USDC when Sell
};

export type TwapTableRow = {
    time: string; // raw ISO timestamp for sorting and client-side i18n formatting
    timeSinceStart: string; // preformatted time diff from first clip
    timeSincePrevious: string | null; // preformatted time diff from previous clip, null for first
    sendAmount: string; // preformatted string, no ticker
    priceBinance: string; // preformatted price (USDC per base token)
    receiveBinance: string; // formatted receive amount for Binance only
    priceBinanceAndRenegade: string; // preformatted price (USDC per base token)
    receiveRenegade: string; // formatted receive amount for Binance with Renegade
    deltaBps: string; // e.g. "+12.34 bps"
};
