"use server";

import type { ChainId } from "@renegade-fi/react/constants";
import { Token } from "@renegade-fi/token-nextjs";
import type z from "zod";
import { formatNumber } from "@/lib/format";
import { DEFAULT_BINANCE_FEE } from "../lib/binance-fee-tiers";
import type { TwapTableData } from "../lib/table-types";
import { findTokenByTicker } from "../lib/token-utils";
import type { SimulateTwapResponseSchema } from "../lib/twap-server-client/api-types/request-response";
import type { TwapTradeResult } from "../lib/twap-server-client/api-types/twap";
import {
    TwapParams,
    TwapParamsSchema,
    TwapUrlParamsSchema,
} from "../lib/twap-server-client/api-types/twap";
import { formatUnitsToNumber } from "../lib/utils";
import { twapLoader } from "../server/loader";

export type SearchParams = { [key: string]: string | string[] | undefined };

export async function getSimulation(searchParams: SearchParams): Promise<{
    baseMint?: string;
    simData: z.output<typeof SimulateTwapResponseSchema> | null;
    table: TwapTableData | null;
}> {
    const urlResult = TwapUrlParamsSchema.safeParse(searchParams);
    if (!urlResult.success) {
        return { baseMint: undefined, simData: null, table: null };
    }

    const { data } = urlResult;

    const baseToken = findTokenByTicker(data.base_ticker);
    const quoteToken = baseToken
        ? Token.fromTickerOnChain("USDC", baseToken.chain as ChainId)
        : undefined;
    if (!baseToken || !quoteToken) {
        return { baseMint: undefined, simData: null, table: null };
    }

    const serverParams = TwapParamsSchema.parse({
        base_amount: data.base_amount,
        base_mint: baseToken.address,
        direction: data.direction,
        end_time: data.end_time,
        num_trades: data.num_trades,
        quote_amount: data.quote_amount ?? "0",
        quote_mint: quoteToken.address,
        start_time: data.start_time,
    });

    const feeParam = searchParams.binance_taker_bps as string | undefined;
    const binanceFee = feeParam ? Number(feeParam) : DEFAULT_BINANCE_FEE;

    const simData = await twapLoader(TwapParams.new(serverParams), undefined, {
        binance_fee: binanceFee,
    });

    // Process table data
    const table = processTableData(simData, baseToken, quoteToken);

    return { baseMint: serverParams.base_mint, simData, table };
}

function buildRows(
    tradeMap: Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>,
    direction: "Buy" | "Sell",
    baseToken: any,
    quoteToken: any,
) {
    const rows = [];
    for (const [timestamp, { renegade: renegadeTrade, binance: binanceTrade }] of tradeMap) {
        if (!renegadeTrade || !binanceTrade) continue;

        // Send amount depends on direction
        // For Buy: USDC sold (quote amount)
        // For Sell: base token sold (base amount)
        const sendAmount =
            direction === "Buy" ? renegadeTrade.quote_amount : renegadeTrade.base_amount;
        const sendDecimals = direction === "Buy" ? quoteToken.decimals : baseToken.decimals;

        // Get absolute value and format
        const sendAmountFormatted = formatNumber(
            BigInt(Math.abs(Number(sendAmount))),
            sendDecimals,
            true,
        );

        // Receive amounts depend on direction
        const binanceReceive =
            direction === "Buy" ? binanceTrade.base_amount : binanceTrade.quote_amount;
        const renegadeReceive =
            direction === "Buy" ? renegadeTrade.base_amount : renegadeTrade.quote_amount;
        const receiveDecimals = direction === "Buy" ? baseToken.decimals : quoteToken.decimals;

        const binanceReceiveFormatted = formatNumber(
            BigInt(Math.abs(Number(binanceReceive))),
            receiveDecimals,
            true,
        );

        const renegadeReceiveFormatted = formatNumber(
            BigInt(Math.abs(Number(renegadeReceive))),
            receiveDecimals,
            true,
        );

        // Calculate delta bps numerically then format as string
        const binanceReceiveNum = formatUnitsToNumber(binanceReceive, receiveDecimals);
        const renegadeReceiveNum = formatUnitsToNumber(renegadeReceive, receiveDecimals);

        const deltaBpsNum =
            binanceReceiveNum !== 0
                ? ((renegadeReceiveNum - binanceReceiveNum) / binanceReceiveNum) * 10000
                : 0;

        const sign = deltaBpsNum >= 0 ? "+" : "";
        const deltaBpsFormatted = `${sign}${deltaBpsNum.toFixed(2)} bps`;

        rows.push({
            deltaBps: deltaBpsFormatted,
            receiveAmountBinance: binanceReceiveFormatted,
            receiveAmountRenegade: renegadeReceiveFormatted,
            sendAmount: sendAmountFormatted,
            time: timestamp,
        });
    }

    return rows;
}

function processTableData(
    simData: z.output<typeof SimulateTwapResponseSchema> | null,
    baseToken: any,
    quoteToken: any,
): TwapTableData | null {
    if (!simData || !baseToken || !quoteToken) return null;

    // Get strategies
    const renegade = simData.strategies.find((s) => s.strategy === "Renegade");
    const binance = simData.strategies.find((s) => s.strategy === "Binance");
    if (!renegade || !binance) return null;

    // Get direction from first trade
    const firstTrade = renegade.sim_result.trades[0];
    if (!firstTrade) return null;
    const direction = firstTrade.direction;

    // Compute sendTicker and receiveTicker based on direction
    const sendTicker = direction === "Buy" ? quoteToken.ticker : baseToken.ticker;
    const receiveTicker = direction === "Buy" ? baseToken.ticker : quoteToken.ticker;

    // Merge trades by timestamp
    const renegadeTrades = [...renegade.sim_result.trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const binanceTrades = [...binance.sim_result.trades].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const tradeMap = new Map<string, { renegade?: TwapTradeResult; binance?: TwapTradeResult }>();

    for (const trade of renegadeTrades) {
        const existing = tradeMap.get(trade.timestamp) || {};
        existing.renegade = trade;
        tradeMap.set(trade.timestamp, existing);
    }

    for (const trade of binanceTrades) {
        const existing = tradeMap.get(trade.timestamp) || {};
        existing.binance = trade;
        tradeMap.set(trade.timestamp, existing);
    }

    // Build rows for timestamps present in both strategies
    const rows = buildRows(tradeMap, direction, baseToken, quoteToken);
    const sortedRows = rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return {
        meta: {
            direction,
            receiveTicker,
            sendTicker,
        },
        rows: sortedRows,
    };
}
