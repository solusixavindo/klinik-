"use client"
import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Register SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
      caches?.keys?.()
        .then((keys) => Promise.all(keys.filter((key) => key !== "xaviklinika-v2").map((key) => caches.delete(key))))
        .catch(() => {})
    }

    // Cek apakah sudah diinstall
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const dismissed = localStorage.getItem("pwa-dismissed")
    if (dismissed) return

    // iOS detection
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIos(ios)

    if (ios) {
      // iOS tidak support BeforeInstallPrompt, tampilkan instruksi manual
      const isSafari = /safari/.test(navigator.userAgent.toLowerCase())
      if (isSafari) setShow(true)
      return
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    })
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "1")
    setShow(false)
  }

  if (!show || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-80">
      <div className="rounded-2xl border border-indigo-500/30 bg-slate-900 p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white">X</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install XaviKlinika</p>
            {isIos ? (
              <p className="mt-1 text-xs text-slate-400">
                Tap <span className="text-indigo-400">⎙ Share</span> → <span className="text-indigo-400">Add to Home Screen</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">Akses lebih cepat dari layar utama HP Anda</p>
            )}
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
        </div>
        {!isIos && (
          <div className="mt-3 flex gap-2">
            <button onClick={handleInstall} className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
              Install Sekarang
            </button>
            <button onClick={handleDismiss} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white">
              Nanti
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
