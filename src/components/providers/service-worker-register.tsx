"use client"

import { useEffect } from "react"

function runWhenIdle(callback: () => void) {
    if ("requestIdleCallback" in window) {
        const idleId = window.requestIdleCallback(callback, { timeout: 3000 })
        return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = globalThis.setTimeout(callback, 1500)
    return () => globalThis.clearTimeout(timeoutId)
}

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production") {
            return
        }

        if (!("serviceWorker" in navigator) || !("caches" in window)) {
            return
        }

        let cancelled = false

        const cancelIdle = runWhenIdle(() => {
            if (cancelled) {
                return
            }

            Promise.resolve()
                .then(() => navigator.serviceWorker.register("/sw.js", { scope: "/" }))
                .catch(() => {
                    // Some browsers, extensions, and privacy modes block service workers.
                    // Registration is optional, so it should never break the page runtime.
                })
        })

        return () => {
            cancelled = true
            cancelIdle()
        }
    }, [])

    return null
}
