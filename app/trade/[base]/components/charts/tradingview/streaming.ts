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
  handlers: { id: string; callback: SubscribeBarsCallback }[]
}

const channelToSubscription = new Map<string, SubscriptionItem>()

const socket = new WebSocket("ws://localhost:3000")

socket.addEventListener("open", event => {
  console.log("WebSocket is open now.")
})

socket.addEventListener("message", event => {
  console.log("Message from server ", event.data)
})

socket.addEventListener("close", event => {
  console.log("WebSocket is closed now.")
})

socket.addEventListener("error", event => {
  console.error("WebSocket error observed:", event)
})

socket.onmessage = event => {
  const parsedMessage = JSON.parse(event.data)
  const topic = parsedMessage.topic
  const data = parsedMessage.data

  const subscriptionItem = channelToSubscription.get(topic)
  console.log("[websocket] subscriptionItem:", subscriptionItem)
  if (subscriptionItem === undefined) {
    return
  }
  const lastDailyBar = subscriptionItem.lastDailyBar
  const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time)

  let bar
  if (data.timestamp >= nextDailyBarTime) {
    bar = {
      time: nextDailyBarTime,
      open: lastDailyBar.close,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
    }
    console.log("[socket] Generate new bar", bar)
  } else {
    bar = {
      ...lastDailyBar,
      high: Math.max(lastDailyBar.high, data.high),
      low: Math.min(lastDailyBar.low, data.low),
      close: data.close,
      volume: lastDailyBar.volume + data.volume,
    }
    console.log("[socket] Update the latest bar ", bar)
  }

  subscriptionItem.lastDailyBar = bar

  // Send data to every subscriber of that symbol
  subscriptionItem.handlers.forEach(handler => handler.callback(bar))
}

function getNextDailyBarTime(barTime: number) {
  const date = new Date(barTime)
  date.setDate(date.getDate() + 1)
  return date.getTime()
}

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
  socket.send(
    JSON.stringify({
      type: "subscribe",
      topic,
    }),
  )
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
      handler => handler.id === subscriberUID,
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
