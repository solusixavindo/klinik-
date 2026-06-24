import { friendlySupabaseSetupMessage } from "@/lib/supabaseEnv"

const technicalSetupPattern =
  /supabase|service_role|environment|api key|database|next_public|env|jwt|project settings|rls|schema/i

export function toRegisterErrorMessage(message: string) {
  return technicalSetupPattern.test(message)
    ? friendlySupabaseSetupMessage
    : message
}
