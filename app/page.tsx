import { redirect } from "next/navigation"

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  const target = new URLSearchParams()
  const plan = params?.plan
  if (typeof plan === "string" && plan) {
    target.set("plan", plan)
  }

  const suffix = target.toString()
  redirect(suffix ? `/register?${suffix}` : "/register")
}
