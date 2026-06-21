import { getDemoAccountByEmail, type DemoAccount } from "@/lib/demoAccounts"

export type DemoSession = {
  email: string
  plan: DemoAccount["plan"]
  clinicName: string
}

const STORAGE_KEY = "xaviklinika-demo-session"
const COOKIE_KEY = "xaviklinika-demo-session"

export function getMatchingDemoAccount(email: string, password: string) {
  const account = getDemoAccountByEmail(email)
  if (!account || account.password !== password) return null
  return account
}

export function saveDemoSession(account: DemoAccount) {
  if (typeof window === "undefined") return

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      email: account.email,
      plan: account.plan,
      clinicName: account.clinicName,
    } satisfies DemoSession)
  )
  document.cookie = `${COOKIE_KEY}=${account.plan}; path=/; max-age=86400; SameSite=Lax`
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const session = JSON.parse(raw) as Partial<DemoSession>
    if (!session.email || !session.plan || !session.clinicName) return null

    return {
      email: session.email,
      plan: session.plan,
      clinicName: session.clinicName,
    }
  } catch {
    return null
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`
}
