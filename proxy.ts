import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicRoutes = ["/", "/login", "/register", "/book", "/api/health", "/api/public"]

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const hasAuth = request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token") && cookie.value)

  if (!hasAuth && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
}
