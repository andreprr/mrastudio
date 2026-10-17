"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookingRecord, BookingStatus } from "@/types/database";
import { formatRupiah } from "@/config/site";
import { toast } from "sonner";
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Phone,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    X,
} from "lucide-react";

interface BookingStatusHistoryItem {
    id: string;
    booking_id: string;
    old_status: BookingStatus | null;
    new_status: BookingStatus;
    changed_by: string | null;
    reason: string | null;
    created_at: string;
}

interface BarberOption {
    id: string;
    name: string;
}

interface BookingUpdatePayload {
    status?: BookingStatus;
    reason?: string;
    admin_note?: string;
    booking_date?: string;
    start_time?: string;
    barber_id?: string;
}

export default function AdminBookingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [booking, setBooking] = useState<BookingRecord | null>(null);
    const [history, setHistory] = useState<BookingStatusHistoryItem[]>([]);
    const [barbers, setBarbers] = useState<BarberOption[]>([]);
    const [adminNote, setAdminNote] = useState("");
    const [reason, setReason] = useState("");
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduleBarber, setRescheduleBarber] = useState("");

    // State untuk Custom Modal Konfirmasi Status
    const [modalAction, setModalAction] = useState<{
        status: BookingStatus;
        title: string;
        description: string;
        requireReason?: boolean;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const refreshDetail = useCallback(async () => {
        const supabase = createClient();
        const [{ data: bk }, { data: hist }, { data: brb }] = await Promise.all([
            supabase.from("bookings").select("*").eq("id", id).single(),
            supabase
                .from("booking_status_history")
                .select("*")
                .eq("booking_id", id)
                .order("created_at", { ascending: false }),
            supabase.from("barbers").select("id, name").eq("is_active", true),
        ]);

        if (bk) {
            const typedBooking = bk as BookingRecord;
            setBooking(typedBooking);
            setAdminNote(typedBooking.admin_note || "");
            setRescheduleDate(typedBooking.booking_date);
            setRescheduleTime(typedBooking.start_time.slice(0, 5));
            setRescheduleBarber(typedBooking.barber_id || "");
        }
        setHistory((hist as BookingStatusHistoryItem[]) || []);
        setBarbers((brb as BarberOption[]) || []);
    }, [id]);

    useEffect(() => {
        let ignore = false;
        async function initFetch() {
            const supabase = createClient();
            const [{ data: bk }, { data: hist }, { data: brb }] = await Promise.all([
                supabase.from("bookings").select("*").eq("id", id).single(),
                supabase
                    .from("booking_status_history")
                    .select("*")
                    .eq("booking_id", id)
                    .order("created_at", { ascending: false }),
                supabase.from("barbers").select("id, name").eq("is_active", true),
            ]);

            if (ignore) return;

            if (bk) {
                const typedBooking = bk as BookingRecord;
                setBooking(typedBooking);
                setAdminNote(typedBooking.admin_note || "");
                setRescheduleDate(typedBooking.booking_date);
                setRescheduleTime(typedBooking.start_time.slice(0, 5));
                setRescheduleBarber(typedBooking.barber_id || "");
            }
            setHistory((hist as BookingStatusHistoryItem[]) || []);
            setBarbers((brb as BarberOption[]) || []);
        }

        initFetch();
        return () => {
            ignore = true;
        };
    }, [id]);

    async function updateBooking(payload: BookingUpdatePayload) {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Gagal memperbarui booking.");
                return;
            }
            toast.success("Data reservasi berhasil diperbarui.");
            setModalAction(null);
            setReason("");
            await refreshDetail();
            router.refresh();
        } finally {
            setSubmitting(false);
        }
    }

    if (!booking) {
        return (
            <AdminShell>
                <p className="text-sm text-[#706D65]">Memuat detail reservasi...</p>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <div className="mb-8">
                <Link
                    href="/admin/bookings"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3B281E] hover:underline mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Daftar Booking</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141413]/10">
                    <div>
                        <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-[#141413] text-[#DFC3B0]">
                            {booking.booking_code}
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-2">
                            {booking.customer_name}
                        </h1>
                    </div>
                    <span className="px-5 py-2 rounded-full bg-[#DFC3B0] text-[#141413] text-xs font-extrabold uppercase tracking-widest self-start sm:self-auto">
                        Status: {booking.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    {/* Kartu Informasi Snapshot */}
                    <div className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-7 space-y-4 text-sm">
                        <h2 className="font-display text-lg font-extrabold text-[#141413]">
                            Rincian Tiket Reservasi
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-2xl bg-[#F8F6F1]">
                                <span className="text-[11px] uppercase tracking-wider text-[#706D65] flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> Nomor WhatsApp
                                </span>
                                <p className="font-bold text-base mt-1">
                                    {booking.customer_phone}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#F8F6F1]">
                                <span className="text-[11px] uppercase tracking-wider text-[#706D65] flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Barber Bertugas
                                </span>
                                <p className="font-bold text-base mt-1">
                                    {booking.barber_name_snapshot}
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#F8F6F1]">
                                <span className="text-[11px] uppercase tracking-wider text-[#706D65] flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Tanggal & Jam
                                </span>
                                <p className="font-bold text-base mt-1">
                                    {booking.booking_date} • {booking.start_time.slice(0, 5)} WIB
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#F8F6F1]">
                                <span className="text-[11px] uppercase tracking-wider text-[#706D65] flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> Layanan & Harga Snapshot
                                </span>
                                <p className="font-bold text-base mt-1">
                                    {booking.service_name_snapshot} —{" "}
                                    {formatRupiah(Number(booking.price_snapshot))}
                                </p>
                            </div>
                        </div>
                        {booking.customer_note && (
                            <div className="p-4 rounded-2xl bg-[#F8F6F1] text-xs">
                                <span className="font-bold uppercase text-[#3B281E] block mb-1">
                                    Catatan Pelanggan:
                                </span>
                                <p className="text-[#706D65]">{booking.customer_note}</p>
                            </div>
                        )}
                    </div>

                    {/* Panel Aksi Status (Membuka Modal Dialog Modern) */}
                    <div className="rounded-[2rem] bg-[#141413] text-[#F8F6F1] p-7 space-y-4">
                        <h2 className="font-display text-lg font-extrabold text-[#DFC3B0]">
                            Tindakan Cepat Status Reservasi
                        </h2>
                        <p className="text-xs text-[#EAE4DC]/70">
                            Pilih tindakan di bawah untuk membuka dialog konfirmasi perubahan
                            status.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "confirmed",
                                        title: "Konfirmasi Jadwal Booking",
                                        description:
                                            "Slot akan dikunci secara permanen untuk pelanggan ini.",
                                    })
                                }
                                className="px-5 py-3 rounded-full bg-[#DFC3B0] text-[#141413] text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Konfirmasi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "completed",
                                        title: "Tandai Sesi Selesai",
                                        description:
                                            "Gunakan ini setelah pelanggan selesai mendapatkan layanan di studio.",
                                    })
                                }
                                className="px-5 py-3 rounded-full bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                            >
                                Tandai Selesai
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "cancelled",
                                        title: "Batalkan Reservasi",
                                        description:
                                            "Slot waktu akan dibebaskan kembali agar dapat dipesan pelanggan lain.",
                                        requireReason: true,
                                    })
                                }
                                className="px-5 py-3 rounded-full bg-red-600/20 border border-red-400/30 text-red-200 text-xs font-extrabold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5"
                            >
                                <XCircle className="w-4 h-4" />
                                <span>Batalkan</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "rejected",
                                        title: "Tolak Permintaan Booking",
                                        description:
                                            "Permintaan reservasi akan ditolak dan slot dibebaskan.",
                                        requireReason: true,
                                    })
                                }
                                className="px-5 py-3 rounded-full bg-white/10 text-[#EAE4DC] text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>

                    {/* Form Reschedule & Catatan Internal */}
                    <div className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-7 space-y-4">
                        <h2 className="font-display text-lg font-extrabold">
                            Reschedule Jadwal / Alokasi Barber
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#706D65]">
                                    Tanggal Baru
                                </label>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#706D65]">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#706D65]">
                                    Pilih Barber
                                </label>
                                <select
                                    value={rescheduleBarber}
                                    onChange={(e) => setRescheduleBarber(e.target.value)}
                                    className="w-full mt-1 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-medium"
                                >
                                    {barbers.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#706D65]">
                                Catatan Internal Admin
                            </label>
                            <textarea
                                rows={2}
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Tambahkan catatan internal studio..."
                                className="w-full mt-1 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() =>
                                updateBooking({
                                    booking_date: rescheduleDate,
                                    start_time: rescheduleTime,
                                    barber_id: rescheduleBarber,
                                    admin_note: adminNote,
                                })
                            }
                            className="px-7 py-3.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors"
                        >
                            Simpan Jadwal & Catatan
                        </button>
                    </div>
                </div>

                {/* Kolom Kanan: Audit Log Riwayat Status */}
                <div className="lg:col-span-5 rounded-[2rem] bg-[#EAE4DC]/50 border border-[#141413]/10 p-7 h-fit">
                    <h2 className="font-display text-lg font-extrabold mb-5">
                        Riwayat Perubahan Status
                    </h2>
                    <div className="space-y-3">
                        {history.map((h) => (
                            <div
                                key={h.id}
                                className="p-4 rounded-2xl bg-[#F8F6F1] border border-[#141413]/5 text-xs space-y-1.5"
                            >
                                <div className="flex items-center justify-between font-bold text-[#141413]">
                                    <span className="uppercase tracking-wider">
                                        {h.old_status ? `${h.old_status} → ` : ""}
                                        <span className="text-[#3B281E]">{h.new_status}</span>
                                    </span>
                                    <span className="text-[11px] font-normal text-[#706D65]">
                                        {new Date(h.created_at).toLocaleString("id-ID")}
                                    </span>
                                </div>
                                {h.reason && (
                                    <p className="text-[#706D65] leading-relaxed">{h.reason}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL DIALOG KONFIRMASI PERUBAHAN STATUS */}
            {modalAction && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setModalAction(null)}
                >
                    <div
                        className="relative max-w-md w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setModalAction(null)}
                            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#EAE4DC] flex items-center justify-center"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-11 h-11 rounded-2xl bg-[#DFC3B0] text-[#141413] flex items-center justify-center mb-4">
                            <AlertTriangle className="w-5 h-5" />
                        </div>

                        <h3 className="font-display text-2xl font-extrabold">
                            {modalAction.title}
                        </h3>
                        <p className="text-xs text-[#706D65] mt-2 leading-relaxed">
                            {modalAction.description}
                        </p>

                        <div className="mt-5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-2">
                                Catatan / Alasan Perubahan{" "}
                                {modalAction.requireReason ? "(Wajib)" : "(Opsional)"}
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Masukkan alasan perubahan status..."
                                className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm"
                            />
                        </div>

                        <div className="mt-7 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setModalAction(null)}
                                className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase tracking-wider"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => {
                                    if (modalAction.requireReason && !reason.trim()) {
                                        toast.error("Alasan wajib diisi untuk tindakan ini.");
                                        return;
                                    }
                                    updateBooking({
                                        status: modalAction.status,
                                        reason:
                                            reason.trim() ||
                                            `Status diubah menjadi ${modalAction.status}`,
                                    });
                                }}
                                className="px-6 py-3 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E]"
                            >
                                {submitting ? "Memproses..." : "Ya, Lanjutkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}