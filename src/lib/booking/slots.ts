import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { DEFAULT_SITE_SETTINGS } from "@/config/site";

function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

export interface SlotAvailabilityItem {
    time: string;
    available: boolean;
    reason?: string;
}

export async function calculateAvailableSlots(params: {
    date: string; // YYYY-MM-DD
    serviceId: string;
    barberId?: string | null;
}): Promise<{
    slots: SlotAvailabilityItem[];
    isClosed: boolean;
    message?: string;
}> {
    const supabase = createServiceRoleClient();

    // 1. Ambil pengaturan website
    const { data: settingRow } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "general")
        .single();

    const settings = {
        ...DEFAULT_SITE_SETTINGS,
        ...(settingRow?.value || {}),
    };

    // 2. Validasi tanggal pada zona waktu Asia/Jakarta
    const todayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
    });

    if (params.date < todayStr) {
        return { slots: [], isClosed: true, message: "Tanggal sudah terlewat." };
    }

    // 3. Ambil durasi layanan
    const { data: service } = await supabase
        .from("services")
        .select("id, duration_minutes, is_active")
        .eq("id", params.serviceId)
        .single();

    if (!service || !service.is_active) {
        return { slots: [], isClosed: true, message: "Layanan tidak tersedia." };
    }

    // 4. Periksa hari operasional (0 = Minggu ... 6 = Sabtu)
    const [y, m, d] = params.date.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();

    const { data: bizHour } = await supabase
        .from("business_hours")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

    const effectiveBizHour = bizHour || {
        is_closed: false,
        open_time: "10:00",
        close_time: "21:00",
        break_start: null,
        break_end: null,
    };

    if (effectiveBizHour.is_closed) {
        return {
            slots: [],
            isClosed: true,
            message: "Studio tutup pada hari yang dipilih.",
        };
    }

    // 5. Ambil daftar barber aktif yang relevan
    let barberQuery = supabase
        .from("barbers")
        .select("id, name")
        .eq("is_active", true);

    if (params.barberId) {
        barberQuery = barberQuery.eq("id", params.barberId);
    }

    const { data: activeBarbers } = await barberQuery;
    if (!activeBarbers || activeBarbers.length === 0) {
        return {
            slots: [],
            isClosed: true,
            message: "Tidak ada barber aktif yang tersedia.",
        };
    }

    const barberIds = activeBarbers.map((b) => b.id);

    // 6. Ambil override jadwal barber & booking aktif pada tanggal tersebut
    const [{ data: schedules }, { data: existingBookings }] = await Promise.all([
        supabase
            .from("barber_schedules")
            .select("*")
            .eq("schedule_date", params.date)
            .in("barber_id", barberIds),
        supabase
            .from("bookings")
            .select("barber_id, start_time, end_time, status, expires_at")
            .eq("booking_date", params.date)
            .in("status", ["pending", "confirmed"]),
    ]);

    const nowIso = new Date().toISOString();
    const validBookings = (existingBookings || []).filter(
        (b) => b.status === "confirmed" || (b.status === "pending" && b.expires_at > nowIso)
    );

    // 7. Iterasi pembentukan slot
    const openMin = timeToMinutes(effectiveBizHour.open_time);
    const closeMin = timeToMinutes(effectiveBizHour.close_time);
    const breakStartMin = effectiveBizHour.break_start ? timeToMinutes(effectiveBizHour.break_start) : null;
    const breakEndMin = effectiveBizHour.break_end ? timeToMinutes(effectiveBizHour.break_end) : null;

    const duration = service.duration_minutes;
    const interval = settings.slot_interval_minutes || 30;
    const buffer = settings.buffer_minutes || 10;

    const jakartaParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
    }).formatToParts(new Date());
    const jHour = Number(jakartaParts.find((p) => p.type === "hour")?.value ?? 0);
    const jMin = Number(jakartaParts.find((p) => p.type === "minute")?.value ?? 0);
    const currentJakartaMinutes = jHour * 60 + jMin;

    const slots: SlotAvailabilityItem[] = [];

    for (let start = openMin; start + duration <= closeMin; start += interval) {
        const end = start + duration;
        const label = minutesToTime(start);

        // Lewati jika hari ini dan waktu sudah lewat (tambah margin 15 menit)
        if (params.date === todayStr && start <= currentJakartaMinutes + 15) {
            slots.push({ time: label, available: false, reason: "Waktu lewat" });
            continue;
        }

        // Periksa jam istirahat studio
        if (
            breakStartMin !== null &&
            breakEndMin !== null &&
            start < breakEndMin &&
            end > breakStartMin
        ) {
            slots.push({ time: label, available: false, reason: "Jam istirahat" });
            continue;
        }

        // Cek apakah minimal ada 1 barber dari kandidat yang bebas di slot ini
        const hasFreeBarber = activeBarbers.some((barber) => {
            const customSched = (schedules || []).find(
                (s) => s.barber_id === barber.id
            );
            if (customSched) {
                if (!customSched.is_available) return false;
                if (customSched.start_time && customSched.end_time) {
                    const bStart = timeToMinutes(customSched.start_time);
                    const bEnd = timeToMinutes(customSched.end_time);
                    if (start < bStart || end > bEnd) return false;
                }
            }

            const hasConflict = validBookings.some((bk) => {
                if (bk.barber_id !== barber.id) return false;
                const bkStart = timeToMinutes(bk.start_time);
                const bkEnd = timeToMinutes(bk.end_time) + buffer;
                return start < bkEnd && end > bkStart;
            });

            return !hasConflict;
        });

        slots.push({
            time: label,
            available: hasFreeBarber,
            reason: hasFreeBarber ? undefined : "Penuh",
        });
    }

    return { slots, isClosed: false };
}