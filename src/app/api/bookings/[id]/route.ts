import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const supabase = await createServerSupabase();

    // Verifikasi Admin
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
        status,
        reason,
        admin_note,
        booking_date,
        start_time,
        barber_id,
    } = body;

    const { data: existing, error: fetchErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchErr || !existing) {
        return NextResponse.json(
            { error: "Booking tidak ditemukan." },
            { status: 404 }
        );
    }

    const targetDate = booking_date || existing.booking_date;
    const targetStart = start_time || existing.start_time.slice(0, 5);
    const targetBarberId = barber_id !== undefined ? barber_id : existing.barber_id;

    // Hitung ulang end_time jika jam mulai berubah
    const [sh, sm] = targetStart.split(":").map(Number);
    const endTotalMin = sh * 60 + sm + existing.duration_snapshot;
    const targetEnd = `${Math.floor(endTotalMin / 60)
        .toString()
        .padStart(2, "0")}:${(endTotalMin % 60).toString().padStart(2, "0")}`;

    // Jika jadwal atau barber diubah, periksa benturan dengan booking lain
    if (
        targetBarberId &&
        (targetDate !== existing.booking_date ||
            targetStart !== existing.start_time.slice(0, 5) ||
            targetBarberId !== existing.barber_id)
    ) {
        const { data: conflicts } = await supabase
            .from("bookings")
            .select("id, booking_code, start_time, end_time")
            .eq("barber_id", targetBarberId)
            .eq("booking_date", targetDate)
            .neq("id", id)
            .in("status", ["pending", "confirmed"]);

        const hasOverlap = (conflicts || []).some((c) => {
            const cStart = c.start_time.slice(0, 5);
            const cEnd = c.end_time.slice(0, 5);
            return targetStart < cEnd && targetEnd > cStart;
        });

        if (hasOverlap) {
            return NextResponse.json(
                {
                    error:
                        "Perubahan jadwal ditolak karena berbenturan dengan booking aktif lain pada barber tersebut.",
                },
                { status: 409 }
            );
        }
    }

    let barberNameSnapshot = existing.barber_name_snapshot;
    if (targetBarberId && targetBarberId !== existing.barber_id) {
        const { data: newBarber } = await supabase
            .from("barbers")
            .select("name")
            .eq("id", targetBarberId)
            .single();
        if (newBarber) barberNameSnapshot = newBarber.name;
    }

    const nextStatus = status || existing.status;

    const { error: updateError } = await supabase
        .from("bookings")
        .update({
            status: nextStatus,
            admin_note: admin_note !== undefined ? admin_note : existing.admin_note,
            booking_date: targetDate,
            start_time: targetStart,
            end_time: targetEnd,
            barber_id: targetBarberId,
            barber_name_snapshot: barberNameSnapshot,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (updateError) {
        return NextResponse.json(
            { error: "Gagal memperbarui data booking." },
            { status: 500 }
        );
    }

    if (status && status !== existing.status) {
        await supabase.from("booking_status_history").insert({
            booking_id: id,
            old_status: existing.status,
            new_status: status,
            changed_by: user.id,
            reason: reason || `Diubah oleh admin ke ${status}`,
        });
    }

    return NextResponse.json({ success: true });
}