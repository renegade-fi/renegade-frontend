export type TwapTableMeta = {
    direction: "Buy" | "Sell";
    sendTicker: string; // e.g., USDC when Buy, BASE when Sell
    receiveTicker: string; // e.g., BASE when Buy, USDC when Sell
};

export type TwapTableRow = {
    time: string; // raw ISO timestamp for sorting and client-side i18n formatting
    sendAmount: string; // preformatted string, no ticker
    receiveAmountBinance: string; // preformatted string, no ticker
    receiveAmountRenegade: string; // preformatted string, no ticker
    deltaBps: string; // e.g. "+12.34 bps"
};

export type TwapTableData = {
    meta: TwapTableMeta;
    rows: TwapTableRow[];
};
