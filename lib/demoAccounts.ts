import { PlanCode } from "@/lib/billing"

export type DemoAccount = {
  plan: Exclude<PlanCode, "trial">
  clinicName: string
  email: string
  password: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    plan: "basic",
    clinicName: "Sehat",
    email: "sehat1@gmail.com",
    password: "1234567",
  },
  {
    plan: "standard",
    clinicName: "Bugar",
    email: "sehat2@gmail.com",
    password: "12345678",
  },
  {
    plan: "pro",
    clinicName: "Keluarga",
    email: "sehat3@gmail.com",
    password: "123456789",
  },
  {
    plan: "premium",
    clinicName: "Bahagia",
    email: "sehat4@gmail.com",
    password: "1234567890",
  },
]

export const getDemoAccountByPlan = (plan: string) =>
  DEMO_ACCOUNTS.find((account) => account.plan === plan)

export const getDemoAccountByEmail = (email: string) =>
  DEMO_ACCOUNTS.find((account) => account.email.toLowerCase() === email.toLowerCase())
