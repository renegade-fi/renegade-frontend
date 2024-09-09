import { createNanoEvents } from "nanoevents"

export const orderFormEvents = createNanoEvents<{
  reset: () => void
}>()
