import { MAX_BALANCES, MAX_ORDERS } from "@renegade-fi/react/constants"

export const FEES_SECTION_FEES =
  "Fees accrue on an asset as orders match, and must be paid before withdrawing."
export const FEES_SECTION_BINANCE_FEES =
  "The estimated fees you would pay if you were to execute this order on Binance."
export const FEES_SECTION_TOTAL_SAVINGS =
  "The amount you save by executing this order on Renegade."
export const INSUFFICIENT_BALANCE_TOOLTIP = ({ ticker }: { ticker: string }) =>
  `You do not have enough ${ticker} in your wallet to fully execute this order. Only part of the order will be filled.`
export const MAX_BALANCES_TOOLTIP = `Renegade wallets can hold a maximum of ${MAX_BALANCES} assets at a time.`
export const MAX_ORDERS_TOOLTIP = `Renegade wallets can hold a maximum of ${MAX_ORDERS} orders at a time.`
export const BBO_TOOLTIP =
  "All prices are streamed from centralized exchanges in real-time, and all trades clear at the middle of the Binance bid-ask spread."
export const FAUCET_TOOLTIP = "Click to get more testnet funds."
export const MIDPOINT_TOOLTIP =
  "This order will clear at the middle of the Binance bid-ask spread."
export const GAS_FEE_TOOLTIP =
  "Gas fees for this transaction are paid for by your connected relayer."