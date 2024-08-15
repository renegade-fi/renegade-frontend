import {
  Bar,
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from "@renegade-fi/tradingview-charts"

interface SubscriptionItem {
  subscriberUID: string
  resolution: ResolutionString
  lastDailyBar: Bar
  handlers: { id: string; callback: SubscribeBarsCallback; lastBar: Bar }[]
}

let socket: WebSocket
let isConnected = false
const RECONNECT_INTERVAL = 5000 // 5 seconds

const channelToSubscription = new Map<string, SubscriptionItem>()

function createWebSocket() {
  socket = new WebSocket(process.env.NEXT_PUBLIC_AMBERDATA_PROXY_URL)

  socket.addEventListener("open", (event) => {
    console.log("WebSocket is open now.")
    isConnected = true
    resubscribeAll()
  })

  socket.addEventListener("message", (event) => {
    console.log("Message from server ", event.data)
  })

  socket.addEventListener("close", (event) => {
    console.log("WebSocket is closed now.")
    isConnected = false
    setTimeout(() => {
      console.log("Attempting to reconnect...")
      createWebSocket()
    }, RECONNECT_INTERVAL)
  })

  socket.addEventListener("error", (event) => {
    console.error("WebSocket error observed:", event)
  })

  socket.onmessage = (event) => {
    const parsedMessage = JSON.parse(event.data)
    const topic = parsedMessage.topic
    const data = parsedMessage.data

    const subscriptionItem = channelToSubscription.get(topic)
    console.log("[websocket] subscriptionItem:", subscriptionItem)
    if (subscriptionItem === undefined) {
      return
    }

    for (const handler of subscriptionItem.handlers) {
      const resolution = getResolutionFromUID(handler.id)
      const lastBar = handler.lastBar
      const nextBarTime = getNextBarTime(lastBar.time, resolution)

      let bar
      if (data.timestamp >= nextBarTime) {
        bar = {
          time: nextBarTime,
          open: lastBar.close,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
        }
        console.log("[socket] Generate new bar", bar)
      } else {
        bar = {
          ...lastBar,
          high: Math.max(lastBar.high, data.high),
          low: Math.min(lastBar.low, data.low),
          close: data.close,
          volume: lastBar.volume + data.volume,
        }
        console.log("[socket] Update the latest bar ", bar)
      }
      handler.callback(bar)
      handler.lastBar = bar
    }
  }
}

function resubscribeAll() {
  for (const [topic, subscriptionItem] of Array.from(
    channelToSubscription.entries(),
  )) {
    console.log(`[resubscribe]: Resubscribing to ${topic}`)
    socket.send(
      JSON.stringify({
        type: "subscribe",
        topic,
      }),
    )
  }
}

function getResolutionFromUID(subscriberUID: string): ResolutionString {
  return subscriberUID.split("_").slice(-1)[0] as ResolutionString
}

function getNextBarTime(
  timestamp: number,
  resolution: ResolutionString,
): number {
  const resolutionValue = parseInt(resolution.slice(0, -1))
  const resolutionUnit = resolution.slice(-1)

  const date = new Date(timestamp)

  switch (resolutionUnit) {
    case "M": // Months
      date.setMonth(date.getMonth() + resolutionValue)
      break
    case "W": // Weeks
      date.setDate(date.getDate() + resolutionValue * 7)
      break
    case "D": // Days
      date.setDate(date.getDate() + resolutionValue)
      break
    default: // Minutes
      date.setMinutes(date.getMinutes() + parseInt(resolution))
      break
  }

  return date.getTime()
}

createWebSocket()

export function subscribeOnStream(
  symbolInfo: LibrarySymbolInfo,
  resolution: ResolutionString,
  onTick: SubscribeBarsCallback,
  subscriberUID: string,
  onResetCacheNeededCallback: () => void,
  lastDailyBar: Bar,
) {
  const topic = constructTopicFromUID(subscriberUID)
  const handler = {
    id: subscriberUID,
    callback: onTick,
    lastBar: lastDailyBar,
  }
  let subscriptionItem = channelToSubscription.get(topic)
  if (subscriptionItem) {
    // Already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers.push(handler)
    return
  }
  subscriptionItem = {
    subscriberUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  }
  channelToSubscription.set(topic, subscriptionItem)
  console.log("[subscribeBars]: Subscribe to streaming. Channel:", topic)
  if (isConnected) {
    socket.send(
      JSON.stringify({
        type: "subscribe",
        topic,
      }),
    )
  } else {
    console.log(
      `[subscribeBars]: WebSocket not connected. Will subscribe to ${topic} upon reconnection.`,
    )
  }
}

function constructTopicFromUID(subscriberUID: string) {
  const [base, quote] = subscriberUID.split("_")
  return `binance-${base}_${quote}`
}

export function unsubscribeFromStream(subscriberUID: string) {
  // Find a subscription with id === subscriberUID
  for (const channelString of Array.from(channelToSubscription.keys())) {
    const subscriptionItem = channelToSubscription.get(channelString)
    if (subscriptionItem === undefined) {
      continue
    }
    const handlerIndex = subscriptionItem.handlers.findIndex(
      (handler) => handler.id === subscriberUID,
    )

    if (handlerIndex !== -1) {
      // Remove from handlers
      subscriptionItem.handlers.splice(handlerIndex, 1)

      if (subscriptionItem.handlers.length === 0) {
        // Unsubscribe from the channel if it is the last handler
        console.log(
          "[unsubscribeBars]: Unsubscribe from streaming. Channel:",
          channelString,
        )
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            topic: channelString,
          }),
        )
        channelToSubscription.delete(channelString)
        break
      }
    }
  }
}
