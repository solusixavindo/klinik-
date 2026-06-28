import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const publicRoutePrefixes = [
  "/demo",
  "/login",
  "/register",
  "/book",
]

const publicApiPrefixes = [
  "/api/public",
  "/api/register",
]

const publicRoutes = [
  "/",
]

const publicApiRoutes = [
  "/api/health",
  "/api/env-check",
  "/api/register/diagnostics",
  "/api/xendit",
  "/api/subscription/notification",
  "/api/cron/trial-reminder",
]

function normalizePathname(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

function isPublicPath(rawPathname: string) {
  const pathname = normalizePathname(rawPathname)

  return (
    publicRoutes.includes(pathname) ||
    publicApiRoutes.includes(pathname) ||
    publicRoutePrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    publicApiPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  )
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const hasAuthCookie = request.cookies.getAll().some((cookie) => cookie.name.endsWith("-auth-token") && cookie.value)
  const hasDemoSession = Boolean(request.cookies.get("xaviklinika-demo-session")?.value)
  // Supabase JS v2 stores sessions in localStorage, so browser API calls use Authorization header
  const hasAuthHeader = Boolean(request.headers.get("authorization")?.toLowerCase().startsWith("bearer "))

  // API routes: block if no auth at all (cookie, demo session, or Authorization header)
  if (pathname.startsWith("/api/")) {
    if (!hasAuthCookie && !hasDemoSession && !hasAuthHeader) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak ditemukan" },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Page routes: do NOT redirect here — client-side auth in (dashboard)/layout.tsx
  // handles redirects. Middleware cannot check localStorage-based Supabase sessions.
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}
