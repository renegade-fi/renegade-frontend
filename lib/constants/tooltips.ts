export const FEES_SECTION_FEES =
  "Fees accrue on a balance as orders match, and must be paid before withdrawing."
export const FEES_SECTION_BINANCE_FEES =
  "The estimated fees you would pay if you were to execute this order on Binance."
export const FEES_SECTION_TOTAL_SAVINGS =
  "The amount you save by executing this order on Renegade."
export const INSUFFICIENT_BALANCE_TOOLTIP = ({ ticker }: { ticker: string }) =>
  `You do not have enough ${ticker} in your wallet to fully execute this order. Only part of the order will be filled.`
