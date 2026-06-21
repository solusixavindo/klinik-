"use client"
import { useEffect } from "react"

export default function PwaInstaller() {
  useEffect(() => {
    // Disable stale PWA caches so the app shell never serves the old landing page.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {})
      caches?.keys?.()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {})
    }
  }, [])

  return null
}
