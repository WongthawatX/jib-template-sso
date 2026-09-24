"use client"

import { useSyncExternalStore } from "react"

const MOBILE_QUERY = "(max-width: 1024px)"

const subscribe = ( onChange: () => void ): (() => void) => {
    const media = window.matchMedia(MOBILE_QUERY)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
}

export function useIsMobile(): boolean {
    return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false)
}
