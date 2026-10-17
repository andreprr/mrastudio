import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createBookingSchema } from "@/lib/validations/booking";
import { calculateAvailableSlots } from "@/lib/booking/slots";
import { DEFAULT_SITE_SETTINGS, normalizePhone } from "@/config/site";

// Simple in-memory rate limiter per IP
const ipRequestMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const record = ipRequestMap.get(ip);
    if (!record || now > record.resetAt) {
        ipRequestMap.set(ip, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (record.count >= limit) return false;
    record.count += 1;
    return true;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const barberId = searchParams.get("barberId");

    if (!date || !serviceId) {
        return NextResponse.json(
            { error: "Parameter tanggal dan layanan wajib diisi." },
            { status: 400 }
        );
    }

    try {
        const result = await calculateAvailableSlots({
            date,
            serviceId,
            barberId: barberId && barberId !== "any" ? barberId : null,
        });
        return NextResponse.json(result);
    } catch {
        return NextResponse.json(
            { error: "Gagal memuat ketersediaan jadwal." },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (!checkRateLimit(ip, 6, 60_000)) {
        return NextResponse.json(
            { error: "Terlalu banyak permintaan. Silakan tunggu beberapa saat." },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const parsed = createBookingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error:
                        parsed.error.issues[0]?.message ||
                        "Data formulir tidak valid. Periksa kembali input Anda.",
                },
                { status: 400 }
            );
        }

        const supabase = createServiceRoleClient();

        // Ambil konfigurasi buffer dan masa berlaku dari site_settings
        const { data: settingRow } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "general")
            .single();

        const settings = {
            ...DEFAULT_SITE_SETTINGS,
            ...(settingRow?.value || {}),
        };

        const normalizedPhone = normalizePhone(parsed.data.customer_phone);

        // Panggil fungsi PostgreSQL Atomik (Menangani snapshot harga dari DB & pencegahan double-booking)
        const { data, error } = await supabase.rpc("create_booking_atomic", {
            p_customer_name: parsed.data.customer_name,
            p_customer_phone: normalizedPhone,
            p_service_id: parsed.data.service_id,
            p_barber_id: parsed.data.barber_id || null,
            p_booking_date: parsed.data.booking_date,
            p_start_time: parsed.data.start_time,
            p_customer_note: parsed.data.customer_note || null,
            p_buffer_minutes: settings.buffer_minutes,
            p_pending_expiry_minutes: settings.pending_expiry_minutes,
        });

        if (error) {
            const msg = error.message || "";
            if (msg.includes("SLOT_PENUH")) {
                return NextResponse.json(
                    {
                        error:
                            "Maaf, slot waktu tersebut baru saja diambil pelanggan lain. Silakan pilih waktu lain.",
                    },
                    { status: 409 }
                );
            }
            if (
                msg.includes("STUDIO_TUTUP") ||
                msg.includes("DILUAR_JAM_KERJA") ||
                msg.includes("JAM_ISTIRAHAT") ||
                msg.includes("BARBER_LIBUR")
            ) {
                return NextResponse.json(
                    { error: msg.split(": ")[1] || "Jadwal tidak tersedia." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: "Gagal memproses booking. Silakan coba lagi." },
                { status: 500 }
            );
        }

        return NextResponse.json({ booking: data }, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: "Terjadi kesalahan sistem saat menyimpan booking." },
            { status: 500 }
        );
    }
}