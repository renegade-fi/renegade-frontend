import z from "zod";

/// The direction of a quote
export const QuoteDirectionSchema = z.enum([
    /// A buy quote
    ///
    /// Buy the base and sell the quote
    "Buy",
    /// A sell quote
    ///
    /// Sell the base and buy the quote
    "Sell",
]);

/// TWAP strategy options
export const TwapStrategySchema = z.enum(["Renegade", "Binance"]);
