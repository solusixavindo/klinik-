import { Buffer } from "node:buffer"

type JwtInfo = {
  looksLikeJwt: boolean
  role: string | null
  ref: string | null
}

export type SupabaseEnvCheck = {
  NEXT_PUBLIC_SUPABASE_URL: {
    exists: boolean
    validFormat: boolean
    projectRef: string | null
  }
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    exists: boolean
    looksLikeJwt: boolean
    role: string | null
    ref: string | null
  }
  SUPABASE_SERVICE_ROLE_KEY: {
    exists: boolean
    looksLikeJwt: boolean
    role: string | null
    ref: string | null
  }
  projectRefMatch: boolean | null
  ready: boolean
  reason?: string
}

export type SupabaseEnvStatus = {
  NEXT_PUBLIC_SUPABASE_URL: boolean
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean
  SUPABASE_SERVICE_ROLE_KEY: boolean
}

const hasValue = (value: string | undefined) => Boolean(value && value.trim().length > 0)

function decodeSupabaseJwt(value: string | undefined): JwtInfo {
  if (!value || !value.trim()) return { looksLikeJwt: false, role: null, ref: null }

  try {
    const parts = value.trim().split(".")
    if (parts.length !== 3) return { looksLikeJwt: false, role: null, ref: null }

    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
    const payload = JSON.parse(Buffer.from(b64 + pad, "base64").toString("utf8")) as {
      role?: unknown
      ref?: unknown
    }

    return {
      looksLikeJwt: true,
      role: typeof payload.role === "string" ? payload.role : null,
      ref: typeof payload.ref === "string" ? payload.ref : null,
    }
  } catch {
    return { looksLikeJwt: false, role: null, ref: null }
  }
}

function parseSupabaseUrl(value: string | undefined) {
  if (!value || !value.trim()) {
    return { exists: false, validFormat: false, projectRef: null }
  }

  try {
    const url = new URL(value.trim())
    const hostname = url.hostname.toLowerCase()
    const validFormat = url.protocol === "https:" && hostname.endsWith(".supabase.co")
    const projectRef = validFormat ? hostname.split(".")[0] : null

    return { exists: true, validFormat, projectRef }
  } catch {
    return { exists: true, validFormat: false, projectRef: null }
  }
}

export function getSupabaseEnvCheck(): SupabaseEnvCheck {
  const url = parseSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = decodeSupabaseJwt(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const serviceRole = decodeSupabaseJwt(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const anonExists = hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const serviceExists = hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const refs = [url.projectRef, anon.ref, serviceRole.ref].filter(Boolean)
  const projectRefMatch = refs.length >= 2 ? refs.every((ref) => ref === refs[0]) : null

  let reason: string | undefined

  if (!url.exists) reason = "NEXT_PUBLIC_SUPABASE_URL belum diisi di Vercel."
  else if (!url.validFormat) reason = "NEXT_PUBLIC_SUPABASE_URL harus berupa Project URL Supabase yang valid, contoh https://xxxxx.supabase.co."
  else if (!anonExists) reason = "NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di Vercel."
  else if (!anon.looksLikeJwt) reason = "NEXT_PUBLIC_SUPABASE_ANON_KEY bukan JWT Supabase yang valid."
  else if (anon.role !== "anon") reason = "NEXT_PUBLIC_SUPABASE_ANON_KEY harus berisi anon public key dari Supabase Project Settings > API."
  else if (!serviceExists) reason = "SUPABASE_SERVICE_ROLE_KEY belum diisi di Vercel."
  else if (!serviceRole.looksLikeJwt) reason = "SUPABASE_SERVICE_ROLE_KEY bukan JWT Supabase yang valid."
  else if (serviceRole.role !== "service_role") reason = "SUPABASE_SERVICE_ROLE_KEY harus berisi service_role key dari Supabase Project Settings > API, bukan anon key."
  else if (projectRefMatch === false) reason = "Supabase URL, anon key, dan service_role key berasal dari project yang berbeda."

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: anonExists,
      looksLikeJwt: anon.looksLikeJwt,
      role: anon.role,
      ref: anon.ref,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: serviceExists,
      looksLikeJwt: serviceRole.looksLikeJwt,
      role: serviceRole.role,
      ref: serviceRole.ref,
    },
    projectRefMatch,
    ready: !reason,
    ...(reason ? { reason } : {}),
  }
}

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const check = getSupabaseEnvCheck()
  return {
    NEXT_PUBLIC_SUPABASE_URL: check.NEXT_PUBLIC_SUPABASE_URL.exists && check.NEXT_PUBLIC_SUPABASE_URL.validFormat,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: check.NEXT_PUBLIC_SUPABASE_ANON_KEY.exists && check.NEXT_PUBLIC_SUPABASE_ANON_KEY.role === "anon",
    SUPABASE_SERVICE_ROLE_KEY: check.SUPABASE_SERVICE_ROLE_KEY.exists && check.SUPABASE_SERVICE_ROLE_KEY.role === "service_role",
  }
}

export function hasBrowserSupabaseEnv() {
  const status = getSupabaseEnvStatus()
  return status.NEXT_PUBLIC_SUPABASE_URL && status.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function hasServerSupabaseEnv() {
  const check = getSupabaseEnvCheck()
  return check.ready
}

export const friendlySupabaseSetupMessage =
  "Konfigurasi pendaftaran belum aktif. Mohon cek SUPABASE_SERVICE_ROLE_KEY di Vercel."
