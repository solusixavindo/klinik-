import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getClinicFromRequest } from "@/lib/getClinicFromRequest"

export const runtime = "nodejs"

export async function GET(req: Request) {
  try {
    const auth = await getClinicFromRequest(req)
    if (!("clinicId" in auth)) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "daily"
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7)
    const clinicId = auth.clinicId

    if (type === "daily") {
      const { data: bookings, error } = await supabaseAdmin
        .from("bookings")
        .select("id, visit_date, price, payment_status, notes, visit_type, patients(name, phone), doctors(name, specialization)")
        .eq("clinic_id", clinicId)
        .eq("visit_date", date)
        .order("created_at", { ascending: true })

      if (error) throw error

      const total = bookings?.reduce((s, b) => s + Number(b.price || 0), 0) ?? 0
      const paid = bookings?.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.price || 0), 0) ?? 0
      const pending = bookings?.filter((b) => b.payment_status === "pending").reduce((s, b) => s + Number(b.price || 0), 0) ?? 0

      return NextResponse.json({
        success: true,
        type: "daily",
        date,
        summary: {
          total_bookings: bookings?.length ?? 0,
          total_revenue: total,
          paid_revenue: paid,
          pending_revenue: pending,
        },
        bookings: bookings ?? [],
      })
    }

    if (type === "monthly") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const { data: bookings, error } = await supabaseAdmin
        .from("bookings")
        .select("id, visit_date, price, payment_status, visit_type, patients(name), doctors(name, specialization)")
        .eq("clinic_id", clinicId)
        .gte("visit_date", monthStart)
        .lt("visit_date", nextMonth)
        .order("visit_date", { ascending: true })

      if (error) throw error

      // Aggregate per day
      const byDay: Record<string, { date: string; bookings: number; revenue: number; paid: number }> = {}
      for (const b of bookings ?? []) {
        const d = b.visit_date as string
        if (!byDay[d]) byDay[d] = { date: d, bookings: 0, revenue: 0, paid: 0 }
        byDay[d].bookings++
        byDay[d].revenue += Number(b.price || 0)
        if (b.payment_status === "paid") byDay[d].paid += Number(b.price || 0)
      }

      const totalRevenue = bookings?.reduce((s, b) => s + Number(b.price || 0), 0) ?? 0
      const paidRevenue = bookings?.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.price || 0), 0) ?? 0

      return NextResponse.json({
        success: true,
        type: "monthly",
        month,
        summary: {
          total_bookings: bookings?.length ?? 0,
          total_revenue: totalRevenue,
          paid_revenue: paidRevenue,
          pending_revenue: totalRevenue - paidRevenue,
        },
        daily_data: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        bookings: bookings ?? [],
      })
    }

    if (type === "operational") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const [bookingsRes, patientsRes, doctorsRes] = await Promise.all([
        supabaseAdmin
          .from("bookings")
          .select("id, visit_date, price, payment_status, visit_type, doctors(name, specialization)")
          .eq("clinic_id", clinicId)
          .gte("visit_date", monthStart)
          .lt("visit_date", nextMonth),
        supabaseAdmin
          .from("patients")
          .select("id, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth),
        supabaseAdmin
          .from("doctors")
          .select("id, name, specialization")
          .eq("clinic_id", clinicId),
      ])

      if (bookingsRes.error) throw bookingsRes.error

      const bookings = bookingsRes.data ?? []

      // Kunjungan per dokter
      const byDoctor: Record<string, { name: string; specialization: string; bookings: number; revenue: number }> = {}
      for (const b of bookings) {
        const doc = b.doctors as unknown as { name: string; specialization: string } | null
        if (!doc) continue
        const key = doc.name
        if (!byDoctor[key]) byDoctor[key] = { name: doc.name, specialization: doc.specialization || "-", bookings: 0, revenue: 0 }
        byDoctor[key].bookings++
        byDoctor[key].revenue += Number(b.price || 0)
      }

      // Visit type breakdown
      const byType = { regular: 0, bpjs: 0, emergency: 0 }
      for (const b of bookings) {
        const t = (b.visit_type as string) || "regular"
        if (t in byType) byType[t as keyof typeof byType]++
      }

      return NextResponse.json({
        success: true,
        type: "operational",
        month,
        summary: {
          total_bookings: bookings.length,
          new_patients: patientsRes.data?.length ?? 0,
          total_doctors: doctorsRes.data?.length ?? 0,
          total_revenue: bookings.reduce((s, b) => s + Number(b.price || 0), 0),
        },
        by_doctor: Object.values(byDoctor).sort((a, b) => b.bookings - a.bookings),
        by_visit_type: byType,
      })
    }

    if (type === "registration") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const [patientsRes, bpjsRes] = await Promise.all([
        supabaseAdmin
          .from("patients")
          .select("id, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth),
        supabaseAdmin
          .from("bpjs_registrations")
          .select("id, created_at")
          .eq("clinic_id", clinicId)
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth),
      ])

      if (patientsRes.error) throw patientsRes.error

      const patients = patientsRes.data ?? []
      const bpjsMap: Record<string, number> = {}
      for (const b of bpjsRes.data ?? []) {
        const day = (b.created_at as string).slice(0, 10)
        bpjsMap[day] = (bpjsMap[day] ?? 0) + 1
      }

      const byDay: Record<string, { date: string; total: number; bpjs: number; regular: number }> = {}
      for (const p of patients) {
        const day = (p.created_at as string).slice(0, 10)
        if (!byDay[day]) byDay[day] = { date: day, total: 0, bpjs: 0, regular: 0 }
        byDay[day].total++
      }
      for (const [day, count] of Object.entries(bpjsMap)) {
        if (!byDay[day]) byDay[day] = { date: day, total: 0, bpjs: 0, regular: 0 }
        byDay[day].bpjs = count
      }
      for (const d of Object.values(byDay)) {
        d.regular = Math.max(0, d.total - d.bpjs)
      }

      const totalBpjs = bpjsRes.data?.length ?? 0
      return NextResponse.json({
        success: true,
        type: "registration",
        month,
        summary: {
          total_patients: patients.length,
          bpjs_patients: totalBpjs,
          regular_patients: Math.max(0, patients.length - totalBpjs),
        },
        daily_data: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      })
    }

    if (type === "service") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const [bookingsRes, recordsRes] = await Promise.all([
        supabaseAdmin
          .from("bookings")
          .select("id, visit_date, doctor_id, doctors(name, specialization)")
          .eq("clinic_id", clinicId)
          .gte("visit_date", monthStart)
          .lt("visit_date", nextMonth),
        supabaseAdmin
          .from("medical_records")
          .select("id, booking_id")
          .eq("clinic_id", clinicId)
          .gte("created_at", monthStart)
          .lt("created_at", nextMonth),
      ])

      if (bookingsRes.error) throw bookingsRes.error

      const bookings = bookingsRes.data ?? []
      const recordBookingIds = new Set((recordsRes.data ?? []).map((r) => r.booking_id))

      const byDoctor: Record<string, { name: string; specialization: string; visits: number; with_records: number }> = {}
      for (const b of bookings) {
        const doc = b.doctors as unknown as { name: string; specialization: string } | null
        if (!doc) continue
        if (!byDoctor[doc.name]) byDoctor[doc.name] = { name: doc.name, specialization: doc.specialization || "-", visits: 0, with_records: 0 }
        byDoctor[doc.name].visits++
        if (recordBookingIds.has(b.id)) byDoctor[doc.name].with_records++
      }

      const totalWithRecords = bookings.filter((b) => recordBookingIds.has(b.id)).length
      return NextResponse.json({
        success: true,
        type: "service",
        month,
        summary: {
          total_visits: bookings.length,
          with_records: totalWithRecords,
          without_records: bookings.length - totalWithRecords,
        },
        by_doctor: Object.values(byDoctor).sort((a, b) => b.visits - a.visits),
        records_coverage_pct: bookings.length > 0 ? Math.round((totalWithRecords / bookings.length) * 100) : 0,
      })
    }

    if (type === "cashier") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const { data: bookings, error } = await supabaseAdmin
        .from("bookings")
        .select("id, visit_date, price, payment_status")
        .eq("clinic_id", clinicId)
        .gte("visit_date", monthStart)
        .lt("visit_date", nextMonth)
        .order("visit_date", { ascending: true })

      if (error) throw error

      const bks = bookings ?? []
      const byDay: Record<string, { date: string; total: number; paid: number; pending: number; partial: number; cancelled: number }> = {}
      for (const b of bks) {
        const day = b.visit_date as string
        if (!byDay[day]) byDay[day] = { date: day, total: 0, paid: 0, pending: 0, partial: 0, cancelled: 0 }
        byDay[day].total++
        const status = (b.payment_status as string) || "pending"
        if (status === "paid") byDay[day].paid++
        else if (status === "pending") byDay[day].pending++
        else if (status === "partial") byDay[day].partial++
        else if (status === "cancelled") byDay[day].cancelled++
      }

      const paid = bks.filter((b) => b.payment_status === "paid").reduce((s, b) => s + Number(b.price || 0), 0)
      return NextResponse.json({
        success: true,
        type: "cashier",
        month,
        summary: {
          total: bks.length,
          paid: bks.filter((b) => b.payment_status === "paid").length,
          pending: bks.filter((b) => b.payment_status === "pending").length,
          partial: bks.filter((b) => b.payment_status === "partial").length,
          cancelled: bks.filter((b) => b.payment_status === "cancelled").length,
          revenue_paid: paid,
        },
        daily_data: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      })
    }

    if (type === "sla") {
      const monthStart = `${month}-01`
      const [y, m] = month.split("-").map(Number)
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const { data: queues, error } = await supabaseAdmin
        .from("queue_entries")
        .select("id, queue_type, created_at, called_at")
        .eq("clinic_id", clinicId)
        .gte("created_at", monthStart)
        .lt("created_at", nextMonth)
        .not("called_at", "is", null)

      if (error) throw error

      const qdata = queues ?? []
      const byType: Record<string, { count: number; total_wait_ms: number }> = {}
      for (const q of qdata) {
        const qt = (q.queue_type as string) || "loket"
        if (!byType[qt]) byType[qt] = { count: 0, total_wait_ms: 0 }
        if (q.called_at && q.created_at) {
          const waitMs = new Date(q.called_at as string).getTime() - new Date(q.created_at as string).getTime()
          if (waitMs > 0) {
            byType[qt].count++
            byType[qt].total_wait_ms += waitMs
          }
        }
      }

      const avgMin = (qt: string) => {
        const d = byType[qt]
        if (!d || d.count === 0) return 0
        return Math.round(d.total_wait_ms / d.count / 60000)
      }

      const byTypeSummary = Object.entries(byType).map(([qt, d]) => ({
        queue_type: qt,
        count: d.count,
        avg_wait_minutes: d.count > 0 ? Math.round(d.total_wait_ms / d.count / 60000) : 0,
      }))

      return NextResponse.json({
        success: true,
        type: "sla",
        month,
        summary: {
          avg_wait_loket: avgMin("loket"),
          avg_wait_poli: avgMin("poli"),
          avg_wait_apotek: avgMin("apotek"),
          total_served: qdata.length,
        },
        by_type: byTypeSummary,
      })
    }

    if (type === "profit_loss") {
      const [y, m] = month.split("-").map(Number)
      // Build 6-month range
      const months: string[] = []
      for (let i = 5; i >= 0; i--) {
        let mm = m - i
        let yy = y
        while (mm <= 0) { mm += 12; yy-- }
        months.push(`${yy}-${String(mm).padStart(2, "0")}`)
      }

      const monthStart = `${month}-01`
      const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`

      const { data: bookings, error } = await supabaseAdmin
        .from("bookings")
        .select("price, payment_status, visit_date")
        .eq("clinic_id", clinicId)
        .gte("visit_date", `${months[0]}-01`)
        .lt("visit_date", nextMonth)

      if (error) throw error

      const bks = bookings ?? []

      // Monthly trend
      const trend = months.map((mo) => {
        const [my, mm2] = mo.split("-").map(Number)
        const ms = `${mo}-01`
        const mn = mm2 === 12 ? `${my + 1}-01-01` : `${my}-${String(mm2 + 1).padStart(2, "0")}-01`
        const rev = bks.filter((b) => {
          const d = b.visit_date as string
          return d >= ms && d < mn && b.payment_status === "paid"
        }).reduce((s, b) => s + Number(b.price || 0), 0)
        const cost = Math.round(rev * 0.4)
        return { month: mo, revenue: rev, estimated_cost: cost, gross_profit: rev - cost }
      })

      const thisMonth = trend[trend.length - 1]
      return NextResponse.json({
        success: true,
        type: "profit_loss",
        month,
        summary: {
          revenue: thisMonth.revenue,
          estimated_cost: thisMonth.estimated_cost,
          gross_profit: thisMonth.gross_profit,
          gross_margin_pct: thisMonth.revenue > 0 ? Math.round((thisMonth.gross_profit / thisMonth.revenue) * 100) : 0,
        },
        monthly_trend: trend,
      })
    }

    if (type === "pharmacy") {
      const { data: items, error } = await supabaseAdmin
        .from("stock_items")
        .select("id, name, category, stock, unit, buy_price, sell_price, min_stock")
        .eq("clinic_id", clinicId)
        .order("name", { ascending: true })

      if (error) throw error

      const all = items ?? []
      const totalStockValue = all.reduce((s, i) => s + Number(i.stock || 0) * Number(i.sell_price || 0), 0)
      const lowStockItems = all.filter((i) => Number(i.stock || 0) <= Number(i.min_stock || 0))

      return NextResponse.json({
        success: true,
        type: "pharmacy",
        month,
        summary: {
          total_items: all.length,
          total_stock_value: totalStockValue,
          low_stock_items: lowStockItems.length,
        },
        items: all,
      })
    }

    return NextResponse.json({ success: false, error: "Tipe laporan tidak valid" }, { status: 400 })
  } catch (err: unknown) {
    console.error("Reports failed", err)
    const message = err instanceof Error ? err.message : "Gagal mengambil data laporan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
