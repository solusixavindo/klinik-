import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Public routes — tidak perlu auth
  const publicRoutes = ["/login", "/register", "/book", "/api/public", "/"]
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next()
  }

  // Cek supabase auth cookie (cookie name sesuai project ID)
  const hasAuth = request.cookies.getAll().some((c) => c.name.includes("-auth-token") && c.value)

  if (!hasAuth && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|logo.png).*)"],
}
