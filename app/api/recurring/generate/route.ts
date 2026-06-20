import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00Z")
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

function nextDueDate(current: string, frequency: string): string {
  if (frequency === "weekly") return addDays(current, 7)
  if (frequency === "biweekly") return addDays(current, 14)
  if (frequency === "monthly") return addMonths(current, 1)
  return addDays(current, 7)
}

type RecurringPlan = {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id: string | null
  name: string
  amount: number
  frequency: string
  visit_type: string
  notes: string | null
  next_due_date: string
}

export async function POST(req: Request) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toISOString()

    // Support both authenticated (clinic-scoped) and service_role (cron) calls
    let clinicId: string | null = null
    const authHeader = req.headers.get("authorization")

    if (authHeader) {
      const auth = await getClinicFromRequest(req)
      if (!("clinicId" in auth)) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
      }
      clinicId = auth.clinicId
    }

    // Build query
    let query = supabaseAdmin
      .from("recurring_plans")
      .select("id, clinic_id, patient_id, doctor_id, name, amount, frequency, visit_type, notes, next_due_date")
      .eq("is_active", true)
      .lte("next_due_date", today)

    if (clinicId) {
      query = query.eq("clinic_id", clinicId)
    }

    const { data: duePlans, error: plansError } = await query

    if (plansError) throw plansError

    const plans = (duePlans || []) as RecurringPlan[]

    if (plans.length === 0) {
      return NextResponse.json({ success: true, generated: 0, bookings: [] })
    }

    const generatedBookings: unknown[] = []

    for (const plan of plans) {
      // Insert booking
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .insert([{
          clinic_id: plan.clinic_id,
          patient_id: plan.patient_id,
          doctor_id: plan.doctor_id,
          visit_date: plan.next_due_date,
          price: plan.amount,
          payment_status: "pending",
          notes: `[Auto] ${plan.name}`,
        }])
        .select("id, visit_date, patient_id, doctor_id, price")
        .single()

      if (bookingError) {
        console.error(`Failed to generate booking for plan ${plan.id}:`, bookingError)
        continue
      }

      // Update next_due_date and last_generated_at
      await supabaseAdmin
        .from("recurring_plans")
        .update({
          next_due_date: nextDueDate(plan.next_due_date, plan.frequency),
          last_generated_at: now,
        })
        .eq("id", plan.id)

      generatedBookings.push({ ...booking, plan_name: plan.name })
    }

    return NextResponse.json({
      success: true,
      generated: generatedBookings.length,
      bookings: generatedBookings,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal generate tagihan recurring"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
