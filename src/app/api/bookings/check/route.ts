import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { checkBookingSchema } from "@/lib/validations/booking";
import { normalizePhone } from "@/config/site";

const lookupLimiter = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const now = Date.now();
    const limitRecord = lookupLimiter.get(ip);

    if (limitRecord && now < limitRecord.resetAt && limitRecord.count >= 8) {
        return NextResponse.json(
            {
                error:
                    "Batas pengecekan tercapai. Silakan tunggu 1 menit sebelum mencoba kembali.",
            },
            { status: 429 }
        );
    }

    lookupLimiter.set(ip, {
        count:
            limitRecord && now < limitRecord.resetAt
                ? limitRecord.count + 1
                : 1,
        resetAt: now + 60_000,
    });

    try {
        const body = await request.json();
        const parsed = checkBookingSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error:
                        parsed.error.issues[0]?.message ||
                        "Nomor WhatsApp tidak valid.",
                },
                { status: 400 }
            );
        }

        const normalizedInputPhone = normalizePhone(
            parsed.data.customer_phone
        );

        const supabase = createServiceRoleClient();

        const { data: booking, error } = await supabase
            .from("bookings")
            .select(
                "booking_code, customer_name, customer_phone, service_name_snapshot, price_snapshot, duration_snapshot, barber_name_snapshot, booking_date, start_time, end_time, status, expires_at"
            )
            .eq("customer_phone", normalizedInputPhone)
            .in("status", ["pending", "confirmed"])
            .order("booking_date", { ascending: false })
            .order("start_time", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !booking) {
            return NextResponse.json(
                {
                    error:
                        "Booking aktif tidak ditemukan untuk nomor WhatsApp tersebut.",
                },
                { status: 404 }
            );
        }

        let currentStatus = booking.status;

        if (
            currentStatus === "pending" &&
            booking.expires_at &&
            new Date(booking.expires_at) < new Date()
        ) {
            currentStatus = "expired";

            await supabase
                .from("bookings")
                .update({
                    status: "expired",
                    updated_at: new Date().toISOString(),
                })
                .eq("booking_code", booking.booking_code);
        }

        return NextResponse.json({
            booking: {
                booking_code: booking.booking_code,
                customer_name: booking.customer_name,
                service_name: booking.service_name_snapshot,
                price: booking.price_snapshot,
                duration_minutes: booking.duration_snapshot,
                barber_name: booking.barber_name_snapshot,
                booking_date: booking.booking_date,
                start_time: booking.start_time.slice(0, 5),
                end_time: booking.end_time.slice(0, 5),
                status: currentStatus,
            },
        });
    } catch {
        return NextResponse.json(
            { error: "Gagal memeriksa status booking." },
            { status: 500 }
        );
    }
}