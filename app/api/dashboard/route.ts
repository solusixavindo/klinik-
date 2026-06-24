import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak ditemukan" },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Sesi login tidak valid" },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("clinic_id")
      .eq("id", userData.user.id)
      .single()

    if (profileError || !profile?.clinic_id) {
      return NextResponse.json(
        { success: false, error: "Data klinik tidak ditemukan" },
        { status: 403 }
      )
    }

    const clinicId = profile.clinic_id

    // Date helpers
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
    const weekStart = last7Days[0]

    const [
      patientsRes,
      doctorsRes,
      bookingsRes,
      bookingRowsRes,
      doctorsListRes,
      schedulesRes,
      weeklyBookingsRes,
      thisMonthBookingsRes,
      lastMonthBookingsRes,
      newPatientsThisMonthRes,
      newPatientsLastMonthRes,
      todayBookingsRes,
      queueNowRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("patients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
      supabaseAdmin
        .from("doctors")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
      supabaseAdmin
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
      supabaseAdmin
        .from("bookings")
        .select("id, visit_date, price, payment_status, patients(name, phone), doctors(name)")
        .eq("clinic_id", clinicId)
        .order("visit_date", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("doctors")
        .select("id, name, specialization, phone")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true })
        .limit(8),
      supabaseAdmin
        .from("schedules")
        .select("id, day, start_time, end_time, doctors(name, specialization)")
        .eq("clinic_id", clinicId)
        .order("day", { ascending: true })
        .limit(12),
      // Weekly visits: bookings for last 7 days
      supabaseAdmin
        .from("bookings")
        .select("visit_date, price")
        .eq("clinic_id", clinicId)
        .gte("visit_date", weekStart)
        .lte("visit_date", today),
      // This month bookings (for revenue + top doctors)
      supabaseAdmin
        .from("bookings")
        .select("id, price, doctors(name, specialization)")
        .eq("clinic_id", clinicId)
        .gte("visit_date", thisMonthStart)
        .lte("visit_date", today),
      // Last month bookings (for revenue comparison)
      supabaseAdmin
        .from("bookings")
        .select("id, price")
        .eq("clinic_id", clinicId)
        .gte("visit_date", lastMonthStart)
        .lte("visit_date", lastMonthEnd),
      // New patients this month
      supabaseAdmin
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .gte("created_at", thisMonthStart + "T00:00:00Z"),
      // New patients last month
      supabaseAdmin
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .gte("created_at", lastMonthStart + "T00:00:00Z")
        .lte("created_at", lastMonthEnd + "T23:59:59Z"),
      // Today's bookings with patient/doctor info
      supabaseAdmin
        .from("bookings")
        .select("id, visit_date, price, payment_status, patients(name, phone), doctors(name)")
        .eq("clinic_id", clinicId)
        .eq("visit_date", today)
        .order("created_at", { ascending: false })
        .limit(5),
      // Queue entries right now (waiting/called/serving)
      supabaseAdmin
        .from("queue_entries")
        .select("id, status, patients(name), doctors(name)")
        .eq("clinic_id", clinicId)
        .eq("queue_date", today)
        .in("status", ["waiting", "called", "serving"]),
    ])

    if (
      patientsRes.error ||
      doctorsRes.error ||
      bookingsRes.error ||
      bookingRowsRes.error ||
      doctorsListRes.error ||
      schedulesRes.error
    ) {
      throw patientsRes.error || doctorsRes.error || bookingsRes.error || bookingRowsRes.error || doctorsListRes.error || schedulesRes.error
    }

    const bookings = bookingRowsRes.data || []
    const revenueToday = bookings
      .filter((b) => b.visit_date === today)
      .reduce((sum, b) => sum + Number(b.price || 0), 0)
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0)

    // Weekly visits per day
    const weeklyBookingsData = weeklyBookingsRes.data || []
    const weeklyVisits = last7Days.map((date) => ({
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" }),
      count: weeklyBookingsData.filter((b) => b.visit_date === date).length,
    }))

    // Revenue this month vs last month
    const thisMonthBookings = thisMonthBookingsRes.data || []
    const lastMonthBookings = lastMonthBookingsRes.data || []
    const revenueThisMonth = thisMonthBookings.reduce((sum, b) => sum + Number(b.price || 0), 0)
    const revenueLastMonth = lastMonthBookings.reduce((sum, b) => sum + Number(b.price || 0), 0)

    // Top 5 doctors by bookings this month
    type DoctorBooking = { name?: string; specialization?: string }
    const doctorBookingMap = new Map<string, { name: string; specialization: string; bookings: number; revenue: number }>()
    for (const b of thisMonthBookings) {
      const doc = b.doctors as DoctorBooking | null
      if (!doc?.name) continue
      const key = doc.name
      const existing = doctorBookingMap.get(key)
      if (existing) {
        existing.bookings++
        existing.revenue += Number(b.price || 0)
      } else {
        doctorBookingMap.set(key, {
          name: doc.name,
          specialization: doc.specialization || "Dokter Umum",
          bookings: 1,
          revenue: Number(b.price || 0),
        })
      }
    }
    const topDoctors = [...doctorBookingMap.values()]
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    // Today stats
    const todayBookings = todayBookingsRes.data || []
    const todayDone = todayBookings.filter((b) => b.payment_status === "paid").length
    const todayPending = todayBookings.length - todayDone
    const revenueToday2 = todayBookings.reduce((sum, b) => sum + Number(b.price || 0), 0)

    // Queue now
    const queueEntries = queueNowRes.data || []
    const waiting = queueEntries.filter((e) => e.status === "waiting").length
    const called = queueEntries.filter((e) => e.status === "called").length
    const serving = queueEntries.filter((e) => e.status === "serving").length

    return NextResponse.json({
      success: true,
      stats: {
        patients: patientsRes.count || 0,
        doctors: doctorsRes.count || 0,
        bookings: bookingsRes.count || 0,
        revenueToday,
        totalRevenue,
      },
      bookings,
      doctors: doctorsListRes.data || [],
      schedules: schedulesRes.data || [],
      // Analytics additions
      weekly_visits: weeklyVisits,
      top_doctors: topDoctors,
      revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth,
      new_patients_this_month: newPatientsThisMonthRes.count || 0,
      new_patients_last_month: newPatientsLastMonthRes.count || 0,
      today_stats: {
        total: todayBookings.length,
        done: todayDone,
        pending: todayPending,
        revenue_today: revenueToday2,
      },
      today_bookings: todayBookings,
      queue_now: { waiting, called, serving },
      queue_entries: queueEntries,
    })
  } catch (err: unknown) {
    console.error("Fetch dashboard stats failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil statistik dashboard"
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
