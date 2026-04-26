"use client"

import { useEffect, useState, type ElementType } from "react"

type RuntimeComponent = ElementType

function scheduleIdle(callback: () => void) {
  if (typeof window === "undefined") return

  const requestIdle = window.requestIdleCallback ?? ((handler: IdleRequestCallback) => window.setTimeout(() => handler({ didTimeout: false, timeRemaining: () => 0 }), 1200))
  const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout
  const idleId = requestIdle(callback, { timeout: 2500 })

  return () => cancelIdle(idleId)
}

export function DeferredClientRuntime() {
  const [components, setComponents] = useState<RuntimeComponent[]>([])

  useEffect(() => {
    let isMounted = true

    const cancel = scheduleIdle(() => {
      void Promise.all([
        import("@/components/providers/onesignal-provider").then((module) => module.OneSignalSetup),
        import("@/components/pwa/install-app-prompt").then((module) => module.InstallAppPrompt),
      ]).then((loadedComponents) => {
        if (isMounted) {
          setComponents(loadedComponents)
        }
      })
    })

    return () => {
      isMounted = false
      cancel?.()
    }
  }, [])

  return (
    <>
      {components.map((Component, index) => (
        <Component key={index} />
      ))}
    </>
  )
}
