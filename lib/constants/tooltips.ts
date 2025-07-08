import { MAX_BALANCES, MAX_ORDERS } from "@renegade-fi/react/constants";

export const FEES_SECTION_FEES =
    "0.02% protocol fee and 0.02% relayer fee are paid upon successful matches. To get lower fees, run your own relayer.";
export const FEES_SECTION_TOTAL_SAVINGS =
    "The amount you save by executing this order on Renegade.";
export const UNDERCAPITALIZED_ORDER_TOOLTIP = ({ ticker }: { ticker: string }) =>
    `You do not have enough ${ticker} in your wallet to fully execute this order. Only part of the order will be filled.`;
export const MAX_BALANCES_TOOLTIP = `Renegade wallets can hold a maximum of ${MAX_BALANCES} assets at a time.`;
export const MAX_ORDERS_TOOLTIP = `Renegade wallets can hold a maximum of ${MAX_ORDERS} orders at a time.`;
export const BBO_TOOLTIP = (ex: string) =>
    `All prices are streamed from centralized exchanges in real-time, and all trades clear at the middle of the ${ex} bid-ask spread.`;
export const FAUCET_TOOLTIP = "Click to get more testnet funds.";
export const MIDPOINT_TOOLTIP = (ex: string) =>
    `This order will clear at the middle of the ${ex} bid-ask spread.`;
export const GAS_FEE_TOOLTIP =
    "Gas fees for this transaction are paid for by your connected relayer.";
export const MAX_BALANCES_PLACE_ORDER_TOOLTIP = `This order will not fill because it would result in more than ${MAX_BALANCES} balances.`;
export const ASSETS_TOOLTIP = `Certain assets are whitelisted in the early days of Renegade. Check back soon!`;
export const ASSETS_TABLE_BALANCE_COLUMN_TOOLTIP = (chain?: string) =>
    `Balances show the total of all supported tokens ${
        chain ? `on ${chain} and Ethereum` : "on-chain"
    }.`;
export const ORDER_FORM_DEPOSIT_WARNING = ({ ticker }: { ticker: string }) =>
    `Deposit ${ticker} or USDC to your wallet to place an order.`;
