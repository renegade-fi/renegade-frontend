import { env } from "@/env/server"
import { PriceLevel, TradeAmounts } from "@/lib/price-simulation"
import { Direction } from "@/lib/types"

// -------------
// | CONSTANTS |
// -------------

/** The URL of the Amberdata REST API */
const AMBERDATA_BASE_URL = "https://api.amberdata.com"
/** The API endpoint for spot market orderbook snapshots */
const AMBERDATA_ORDERBOOK_SNAPSHOTS_ROUTE = "markets/spot/order-book-snapshots"
/** The API endpoint for spot market orderbook updates */
const AMBERDATA_ORDERBOOK_UPDATES_ROUTE = "markets/spot/order-book-events"

/** The Amberdata API key header */
const API_KEY_HEADER = "x-api-key"

/** The search parameter indicating the exchange to make a request for */
const EXCHANGE_PARAM = "exchange"

/** The search parameter indicating the sort order for the Amberdata API to use */
const SORT_PARAM = "sortDirection"
/** The search parameter indicating the timestamp format for the Amberdata API to use */
const TIME_FORMAT_PARAM = "timeFormat"
/** The format for timestamps returned from the Amberdata API */
const TIME_FORMAT = "milliseconds"

/** The search parameter indicating the start date for the Amberdata API to use */
const START_DATE_PARAM = "startDate"
/** The search parameter indicating the end date for the Amberdata API to use */
const END_DATE_PARAM = "endDate"

// ---------
// | TYPES |
// ---------

/**
 * Amberdata's API response for an orderbook snapshot.
 * This type only specifies the subset of the response data
 * we are interested in.
 */
type AmberdataOrderbookSnapshotResponse = {
  payload: {
    data: AmberdataOrderbookSnapshot[]
  }
}

/** Amberdata's format for an orderbook snapshot */
type AmberdataOrderbookSnapshot = {
  timestamp: number
  ask: AmberdataPriceLevel[]
  bid: AmberdataPriceLevel[]
}

/**
 * Amberdata's API response for an orderbook update.
 * This type only specifies the subset of the response data
 * we are interested in.
 */
type AmberdataOrderbookUpdateResponse = {
  payload: {
    data: AmberdataOrderbookUpdate[]
  }
}

/** Amberdata's format for an orderbook update */
type AmberdataOrderbookUpdate = {
  exchangeTimestamp: number
  ask: AmberdataPriceLevel[]
  bid: AmberdataPriceLevel[]
}

/**
 * Amberdata's format for an orderbook price level
 */
type AmberdataPriceLevel = {
  price: number
  volume: number
}

/**
 * An intermediary representation of an orderbook, mapping prices to quantities.
 * This is useful for applying updates onto a snapshot efficiently.
 */
type OrderbookMap = {
  bids: {
    [price: number]: number
  }
  asks: {
    [price: number]: number
  }
}

/** The reponse data from this route */
export type OrderbookResponseData = {
  timestamp: number
  bids: PriceLevel[]
  asks: PriceLevel[]
}

// -----------
// | HELPERS |
// -----------
export function calculateSavings(
  tradeAmounts: TradeAmounts,
  quantity: number,
  direction: Direction,
  renegadePrice: number,
  renegadeFeeRate: number,
): number {
  const { effectiveBaseAmount, effectiveQuoteAmount } = tradeAmounts

  const renegadeQuote = quantity * renegadePrice

  const effectiveRenegadeBase =
    direction === Direction.BUY ? quantity * (1 - renegadeFeeRate) : quantity

  const effectiveRenegadeQuote =
    direction === Direction.SELL
      ? renegadeQuote * (1 - renegadeFeeRate)
      : renegadeQuote

  // Calculate the savings in base/quote amounts transacted between the canonical exchange and Renegade trades.
  // When buying, we save when we receive more base and send less quote than on the canonical exchange.
  // When selling, we save when we receive more quote and send less base than on the canonical exchange.
  const baseSavings =
    direction === Direction.BUY
      ? effectiveRenegadeBase - effectiveBaseAmount
      : effectiveBaseAmount - effectiveRenegadeBase

  const quoteSavings =
    direction === Direction.SELL
      ? effectiveRenegadeQuote - effectiveQuoteAmount
      : effectiveQuoteAmount - effectiveRenegadeQuote

  // Represent the total savings via Renegade, denominated in the quote asset, priced at the current midpoint
  return baseSavings * renegadePrice + quoteSavings
}

/**
 * Construct the canonical exchange's orderbook for the given instrument, at the given timestamp.
 * This is done by fetching the most recent orderbook snapshot relative to the
 * timestamp, then fetching all of the updates between the snapshot and the timestamp,
 * and applying them on top of the snapshot.
 */
export async function constructOrderbook(
  instrument: string,
  timestamp: number,
  exchange: string,
): Promise<OrderbookResponseData> {
  const snapshot = await fetchOrderbookSnapshot(instrument, exchange)
  const updates = await fetchOrderbookUpdates(
    instrument,
    snapshot.timestamp,
    timestamp,
    exchange,
  )

  // Construct an initial orderbook map from the snapshot
  let orderbookMap: OrderbookMap = {
    bids: {},
    asks: {},
  }
  snapshot.bid.forEach((level) => {
    orderbookMap.bids[level.price] = level.volume
  })
  snapshot.ask.forEach((level) => {
    orderbookMap.asks[level.price] = level.volume
  })

  // Apply the updates to the map
  // (they are given in ascending order by time, i.e. most recent is last)
  updates.forEach((update) => {
    update.bid.forEach((level) => {
      orderbookMap.bids[level.price] = level.volume
    })
    update.ask.forEach((level) => {
      orderbookMap.asks[level.price] = level.volume
    })
  })

  // Use the timestamp of the most recent update
  const lastUpdateIdx = updates.length - 1
  const finalTimestamp = updates[lastUpdateIdx].exchangeTimestamp

  return convertOrderbookMap(orderbookMap, finalTimestamp)
}

/**
 * Fetches a snapshot of the canonical exchange's orderbook for the given pair symbol,
 * around the given timestamp (in milliseconds), up to the maximum supported depth (5000 levels).
 */
async function fetchOrderbookSnapshot(
  instrument: string,
  exchange: string,
): Promise<AmberdataOrderbookSnapshot> {
  // We don't specify a timeframe, most recent snapshot is returned by default
  const req = amberdataRequest({
    route: `${AMBERDATA_ORDERBOOK_SNAPSHOTS_ROUTE}/${instrument}`,
    exchange,
    sort: "desc",
  })

  const res = await fetch(req)
  if (!res.ok) {
    throw new Error(`Failed to fetch orderbook snapshot: ${res.statusText}`)
  }
  const orderbookRes: AmberdataOrderbookSnapshotResponse = await res.json()
  if (orderbookRes.payload.data.length === 0) {
    throw new Error("Server returned empty orderbook snapshot")
  }

  // We specify sortDirection=desc, so the most recent snapshot is first
  return orderbookRes.payload.data[0]
}

/**
 * Fetches all of the orderbook updates for the given instrument,
 * from the timestamp of the most recent snapshot, to the desired timestamp
 */
async function fetchOrderbookUpdates(
  instrument: string,
  snapshotTimestamp: number,
  desiredTimestamp: number,
  exchange: string,
): Promise<Array<AmberdataOrderbookUpdate>> {
  // We only request updates on or after the snapshot timestamp
  const req = amberdataRequest({
    route: `${AMBERDATA_ORDERBOOK_UPDATES_ROUTE}/${instrument}`,
    exchange,
    startDate: snapshotTimestamp,
  })

  const res = await fetch(req)
  const updatesRes: AmberdataOrderbookUpdateResponse = await res.json()

  // Filter out updates that are outside of the desired timestamp range
  const filteredUpdates = updatesRes.payload.data.filter(
    (update) =>
      update.exchangeTimestamp >= snapshotTimestamp &&
      update.exchangeTimestamp <= desiredTimestamp,
  )
  return filteredUpdates
}

/**
 * Constructs an Amberdata API GET request for the given route,
 * setting the search parameters & API key header appropriately.
 *
 * @param startDate - The starting timestamp for the search range, in milliseconds (inclusive)
 * @param sort - The sort order for the search range, in milliseconds (exclusive)
 */
function amberdataRequest({
  route,
  exchange,
  startDate,
  sort = "asc",
}: {
  route: string
  exchange: string
  startDate?: number
  sort?: "asc" | "desc"
}): Request {
  const amberdataUrl = new URL(`${AMBERDATA_BASE_URL}/${route}`)
  amberdataUrl.searchParams.set(EXCHANGE_PARAM, exchange)
  amberdataUrl.searchParams.set(TIME_FORMAT_PARAM, TIME_FORMAT)
  if (startDate) {
    amberdataUrl.searchParams.set(START_DATE_PARAM, startDate.toString())
  }
  if (sort) {
    amberdataUrl.searchParams.set(SORT_PARAM, sort)
  }

  let amberdataReq = new Request(amberdataUrl)
  amberdataReq.headers.set(API_KEY_HEADER, env.AMBERDATA_API_KEY)
  amberdataReq.headers.set("Accept-Encoding", "gzip")

  return amberdataReq
}

/** Converts an orderbook map to a valid orderbook response */
function convertOrderbookMap(
  orderbookMap: OrderbookMap,
  timestamp: number,
): OrderbookResponseData {
  // Filter out the empty levels & sort in expected order
  const bids = Object.entries(orderbookMap.bids)
    .filter(([_price, volume]) => volume > 0)
    .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
    .sort((a, b) => b.price - a.price)

  const asks = Object.entries(orderbookMap.asks)
    .filter(([_price, volume]) => volume > 0)
    .map(([price, quantity]) => ({ price: parseFloat(price), quantity }))
    .sort((a, b) => a.price - b.price)

  return { bids, asks, timestamp }
}

/**
 * Fetches the fee rate for the given exchange
 */
export function getExchangeFeeRate(exchange: string): number {
  switch (exchange.toLowerCase()) {
    case "coinbase":
      // Coinbase taker fee for traders w/ 100k to 1M in monthly trading volume.
      // Source: https://help.coinbase.com/en/exchange/trading-and-funding/exchange-fees
      return 0.002
    // Kraken Pro taker fee for traders w/ 500k to 1M in monthly trading volume.
    // Source: https://www.kraken.com/features/fee-schedule
    case "kraken":
      return 0.0018
    // Binance taker fee for traders w/ <1M in monthly trading volume.
    // Source: https://www.binance.com/en/fee/schedule
    case "binance":
    default:
      return 0.001
  }
}
