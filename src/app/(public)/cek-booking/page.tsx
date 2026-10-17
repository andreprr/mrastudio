"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { formatRupiah } from "@/config/site";
import { BookingStatus } from "@/types/database";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CheckedBookingResult {
    booking_code: string;
    customer_name: string;
    service_name: string;
    price: number;
    duration_minutes: number;
    barber_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
}

const STATUS_LABELS: Record<
    BookingStatus,
    { label: string; badgeClass: string; guide: string }
> = {
    pending: {
        label: "Menunggu Konfirmasi (Pending)",
        badgeClass: "bg-amber-200 text-amber-950",
        guide:
            "Reservasi Anda telah diterima dan slot sedang ditahan. Admin kami akan segera memverifikasi jadwal Anda.",
    },
    confirmed: {
        label: "Terkonfirmasi (Confirmed)",
        badgeClass: "bg-emerald-200 text-emerald-950",
        guide:
            "Jadwal Anda sudah dikonfirmasi! Mohon hadir 10 menit sebelum jam yang dipilih.",
    },
    completed: {
        label: "Selesai (Completed)",
        badgeClass: "bg-stone-300 text-stone-900",
        guide:
            "Sesi potong rambut telah selesai. Terima kasih telah mempercayakan gaya Anda di MR A Studio.",
    },
    cancelled: {
        label: "Dibatalkan (Cancelled)",
        badgeClass: "bg-red-200 text-red-950",
        guide:
            "Reservasi ini telah dibatalkan. Silakan buat booking baru jika ingin menjadwalkan ulang.",
    },
    rejected: {
        label: "Ditolak (Rejected)",
        badgeClass: "bg-red-200 text-red-950",
        guide:
            "Maaf, reservasi tidak dapat diproses. Silakan hubungi WhatsApp studio untuk informasi lebih lanjut.",
    },
    expired: {
        label: "Kedaluwarsa (Expired)",
        badgeClass: "bg-stone-200 text-stone-700",
        guide:
            "Masa tunggu konfirmasi booking telah berakhir. Silakan lakukan pemesanan ulang.",
    },
};

export default function CekBookingPage() {
    const [bookingCode, setBookingCode] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CheckedBookingResult | null>(null);

    async function handleLookup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/bookings/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_code: bookingCode,
                    customer_phone: customerPhone,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Booking tidak ditemukan.");
                return;
            }
            setResult(data.booking as CheckedBookingResult);
        } catch {
            toast.error("Terjadi kesalahan saat memeriksa booking.");
        } finally {
            setLoading(false);
        }
    }

    const statusMeta = result
        ? STATUS_LABELS[result.status] || STATUS_LABELS.pending
        : null;

    return (
        <div className="min-h-screen bg-brand-cream">
            <Navbar />
            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
                <div className="text-center mb-8">
                    <span className="text-xs font-semibold uppercase tracking-widest text-brand-espresso">
                        Status Reservasi
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">
                        Cek Booking Anda
                    </h1>
                    <p className="text-sm text-brand-gray mt-2">
                        Masukkan Kode Booking dan Nomor WhatsApp yang Anda gunakan saat
                        melakukan pemesanan.
                    </p>
                </div>

                <form
                    onSubmit={handleLookup}
                    className="rounded-3xl bg-brand-beige/70 border border-brand-charcoal/10 p-6 sm:p-8 space-y-4"
                >
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                            Kode Booking
                        </label>
                        <input
                            type="text"
                            required
                            value={bookingCode}
                            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                            placeholder="Contoh: MRA-8F92K1L0"
                            className="w-full px-4 py-3.5 rounded-2xl bg-brand-cream border border-brand-charcoal/15 text-sm uppercase font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                            Nomor WhatsApp
                        </label>
                        <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="w-full px-4 py-3.5 rounded-2xl bg-brand-cream border border-brand-charcoal/15 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-espresso transition-colors"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        <span>Periksa Status Booking</span>
                    </button>
                </form>

                {result && statusMeta && (
                    <div className="mt-8 rounded-3xl bg-brand-beige border border-brand-charcoal/15 p-6 sm:p-8 space-y-4">
                        <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-4">
                            <div>
                                <span className="text-xs text-brand-gray block">Kode Tiket</span>
                                <span className="font-display text-xl font-bold">
                                    {result.booking_code}
                                </span>
                            </div>
                            <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${statusMeta.badgeClass}`}
                            >
                                {statusMeta.label}
                            </span>
                        </div>

                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-brand-gray">Nama Pelanggan</span>
                                <span className="font-semibold">{result.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-brand-gray">Layanan</span>
                                <span className="font-semibold">{result.service_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-brand-gray">Barber</span>
                                <span className="font-semibold">{result.barber_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-brand-gray">Jadwal</span>
                                <span className="font-semibold">
                                    {result.booking_date} • {result.start_time} – {result.end_time}{" "}
                                    WIB
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-brand-charcoal/10">
                                <span className="text-brand-gray">Total Harga</span>
                                <span className="font-display font-bold text-lg">
                                    {formatRupiah(Number(result.price))}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-brand-cream text-xs text-brand-charcoal leading-relaxed">
                            <strong>Petunjuk Selanjutnya:</strong> {statusMeta.guide}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}