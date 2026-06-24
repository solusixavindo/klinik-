export type SupabaseEnvStatus = {
  NEXT_PUBLIC_SUPABASE_URL: boolean
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean
  SUPABASE_SERVICE_ROLE_KEY: boolean
}

const hasValue = (value: string | undefined) => Boolean(value && value.trim().length > 0)

export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  return {
    NEXT_PUBLIC_SUPABASE_URL: hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }
}

export function hasBrowserSupabaseEnv() {
  const status = getSupabaseEnvStatus()
  return status.NEXT_PUBLIC_SUPABASE_URL && status.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function hasServerSupabaseEnv() {
  const status = getSupabaseEnvStatus()
  return status.NEXT_PUBLIC_SUPABASE_URL && status.SUPABASE_SERVICE_ROLE_KEY
}

export const friendlySupabaseSetupMessage =
  "Pendaftaran sedang disiapkan. Mohon coba lagi beberapa saat lagi atau hubungi tim Xavindo."
