import { NextResponse } from "next/server"
import { DEMO_ACCOUNTS, getDemoAccountByPlan } from "@/lib/demoAccounts"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const isMissingClinicSaasColumn = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === "PGRST204" ||
  error?.code === "42703" ||
  error?.message?.toLowerCase().includes("could not find") ||
  error?.message?.toLowerCase().includes("column clinics")

const getExistingUserByEmail = async (email: string) => {
  let page = 1
  const perPage = 100

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) throw error

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase())
    if (user) return user
    if (data.users.length < perPage) return null

    page += 1
  }

  return null
}

export async function POST(req: Request) {
  try {
    const { plan } = await req.json()
    const account = getDemoAccountByPlan(plan)

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: `Pilih salah satu paket demo: ${DEMO_ACCOUNTS.map((item) => item.plan).join(", ")}`,
        },
        { status: 400 }
      )
    }

    let user = await getExistingUserByEmail(account.email)

    if (!user) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          clinic_name: account.clinicName,
          plan: account.plan,
          demo: true,
        },
      })

      if (error || !data.user) {
        throw error || new Error("Gagal membuat akun demo")
      }

      user = data.user
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: account.password,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata || {}),
          clinic_name: account.clinicName,
          plan: account.plan,
          demo: true,
        },
      })

      if (error || !data.user) {
        throw error || new Error("Gagal memperbarui akun demo")
      }

      user = data.user
    }

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .maybeSingle()

    if (profileLookupError) throw profileLookupError

    const clinicPayload = {
      name: account.clinicName,
      plan: account.plan,
      subscription_status: "active",
      trial_ends_at: null,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billing_email: account.email,
      updated_at: new Date().toISOString(),
    }

    let clinicId = existingProfile?.clinic_id

    if (clinicId) {
      const { error } = await supabaseAdmin
        .from("clinics")
        .update(clinicPayload)
        .eq("id", clinicId)

      if (error) {
        if (!isMissingClinicSaasColumn(error)) throw error

        const { error: fallbackError } = await supabaseAdmin
          .from("clinics")
          .update({ name: account.clinicName })
          .eq("id", clinicId)

        if (fallbackError) throw fallbackError
      }
    } else {
      let { data: clinic, error } = await supabaseAdmin
        .from("clinics")
        .insert([clinicPayload])
        .select("id")
        .single()

      if (error && isMissingClinicSaasColumn(error)) {
        const fallback = await supabaseAdmin
          .from("clinics")
          .insert([{ name: account.clinicName }])
          .select("id")
          .single()

        clinic = fallback.data
        error = fallback.error
      }

      if (error || !clinic) {
        throw error || new Error("Gagal membuat klinik demo")
      }

      clinicId = clinic.id
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          clinic_id: clinicId,
          role: "admin",
        },
        { onConflict: "id" }
      )

    if (profileError) throw profileError

    return NextResponse.json({
      success: true,
      account,
    })
  } catch (err: unknown) {
    console.error("Demo registration failed", err)
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyiapkan akun demo"

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
