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

  const hasAuth = request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token") && cookie.value)
  const hasDemoSession = Boolean(request.cookies.get("xaviklinika-demo-session")?.value)

  if (!hasAuth && !hasDemoSession && pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: "Sesi login tidak ditemukan" },
      { status: 401 }
    )
  }

  if (!hasAuth && !hasDemoSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}
