import { createNanoEvents } from "nanoevents"

export const sidebarEvents = createNanoEvents<{
  open: () => void
}>()
