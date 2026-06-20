"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getDemoSession } from "@/lib/demoSession"

type Profile = {
  id: string
  clinic_id: string
  role: string
  avatar_url?: string
  clinics?: { name?: string }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const demoSession = getDemoSession()
      if (demoSession) {
        if (mounted) {
          setProfile({
            id: `demo-${demoSession.plan}`,
            clinic_id: `demo-${demoSession.plan}`,
            role: "admin",
            clinics: { name: demoSession.clinicName },
          })
          setLoading(false)
        }
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      })

      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean
        profile?: Profile
        error?: string
        code?: string
      }

      if (!mounted) return

      if (res.ok && json.success && json.profile) {
        setProfile(json.profile)
      } else if (res.status === 503 && json.code === "SERVICE_ROLE_INVALID" && session.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*, clinics(name)")
          .eq("id", session.user.id)
          .maybeSingle()
        if (!mounted) return
        if (!error && data?.clinic_id) {
          setProfile(data as Profile)
        } else {
          console.error("useProfile fallback:", error?.message ?? json.error)
          setProfile(null)
        }
      } else {
        console.error("useProfile:", json.error ?? res.statusText)
        setProfile(null)
      }
      setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token) {
        if (getDemoSession()) {
          load()
          return
        }

        setProfile(null)
        setLoading(false)
        return
      }
      load()
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (profile) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (getDemoSession()) return
      if (!session) router.replace("/login")
    })
  }, [loading, profile, router])

  return { profile, loading }
}
