import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cachedClient: SupabaseClient | null = null

function sanitizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  // Strip all whitespace (including embedded \n \t \r from copy-paste) and quotes
  const cleaned = raw.replace(/\s+/g, "").replace(/^["'`]+|["'`]+$/g, "")
  try {
    // Use URL.origin to get only scheme+host, stripping any accidental path/fragment
    return new URL(cleaned).origin
  } catch {
    return cleaned || undefined
  }
}

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    )
  }

  cachedClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return cachedClient
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseAdminClient()
    const value = Reflect.get(client, property, receiver)

    return typeof value === "function" ? value.bind(client) : value
  },
})
