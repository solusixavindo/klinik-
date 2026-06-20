import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key"

// Intentionally don't throw here — routes use hasValidSupabaseServiceRoleKey()
// to detect misconfiguration and return a 503 with a helpful message instead of crashing.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
