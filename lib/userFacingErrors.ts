import { friendlySupabaseSetupMessage } from "@/lib/supabaseEnv"

const technicalSetupPattern =
  /supabase|service_role|environment|api key|database|next_public/i

export function toRegisterErrorMessage(message: string) {
  return technicalSetupPattern.test(message)
    ? friendlySupabaseSetupMessage
    : message
}
