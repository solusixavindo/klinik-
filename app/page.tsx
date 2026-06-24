import { redirect } from "next/navigation"

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const mode = params?.mode
  const demo = params?.demo
  const plan = params?.plan

  if (mode === "demo" || typeof demo === "string") {
    const suffix = typeof plan === "string" && plan ? `?plan=${encodeURIComponent(plan)}` : ""
    redirect(`/demo${suffix}`)
  }

  const target = new URLSearchParams()

  for (const key of ["plan"]) {
    const value = params?.[key]
    if (typeof value === "string" && value) {
      target.set(key, value)
    }
  }

  const suffix = target.toString()
  redirect(suffix ? `/register?${suffix}` : "/register")
}
