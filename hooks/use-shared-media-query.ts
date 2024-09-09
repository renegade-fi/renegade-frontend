import { useState, useEffect, useCallback } from "react"

interface MediaQueryState {
  matches: boolean
  listeners: Set<(matches: boolean) => void>
  mql: MediaQueryList | null
}

const mediaQueries: { [query: string]: MediaQueryState } = {}

export function useSharedMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  const updateMatches = useCallback((newMatches: boolean) => {
    setMatches(newMatches)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (!mediaQueries[query]) {
      mediaQueries[query] = {
        matches: window.matchMedia(query).matches,
        listeners: new Set(),
        mql: window.matchMedia(query),
      }
    }

    const state = mediaQueries[query]
    state.listeners.add(updateMatches)

    const handleChange = (e: MediaQueryListEvent) => {
      state.matches = e.matches
      state.listeners.forEach((listener) => listener(e.matches))
    }

    if (state.mql) {
      state.mql.addEventListener("change", handleChange)
    }

    // Initial call to set the initial state
    updateMatches(state.matches)

    return () => {
      if (state.mql) {
        state.mql.removeEventListener("change", handleChange)
      }
      state.listeners.delete(updateMatches)

      if (state.listeners.size === 0) {
        delete mediaQueries[query]
      }
    }
  }, [query, updateMatches])

  return matches
}
