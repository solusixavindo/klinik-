import { redirect } from "next/navigation"

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams
  const target = new URLSearchParams()

  for (const key of ["mode", "plan", "demo"]) {
    const value = params?.[key]
    if (typeof value === "string" && value) {
      target.set(key, value)
    }
  }

  const suffix = target.toString()
  redirect(suffix ? `/register?${suffix}` : "/register")
}
