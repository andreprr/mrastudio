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
                <p className="text-xs text-[#6E6D68]">Memuat detail reservasi...</p>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <div className="mb-6">
                <Link
                    href="/admin/bookings"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6D68] hover:text-[#111110] mb-3 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Daftar Booking</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4E2DD]">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#111110]">
                                {booking.booking_code}
                            </span>
                            <span className="text-xs text-[#6E6D68]">•</span>
                            <span className="text-xs text-[#6E6D68]">Dibuat {new Date(booking.created_at).toLocaleDateString("id-ID")}</span>
                        </div>
                        <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111110] mt-1">
                            {booking.customer_name}
                        </h1>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] self-start sm:self-auto">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            booking.status === "confirmed" ? "bg-emerald-500" :
                            booking.status === "pending" ? "bg-amber-500" :
                            booking.status === "completed" ? "bg-zinc-500" : "bg-red-500"
                        }`} />
                        Status: <span className="font-semibold uppercase">{booking.status}</span>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    {/* Key-Value Description List */}
                    <div className="bg-white border border-[#E4E2DD] rounded-md p-5">
                        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#6E6D68] mb-4">
                            Rincian Tiket Reservasi
                        </h2>
                        <dl className="divide-y divide-[#E4E2DD] text-xs">
                            <div className="py-2.5 flex justify-between gap-4">
                                <dt className="text-[#6E6D68]">WhatsApp</dt>
                                <dd className="font-mono font-medium text-[#111110]">{booking.customer_phone}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between gap-4">
                                <dt className="text-[#6E6D68]">Barber Bertugas</dt>
                                <dd className="font-medium text-[#111110]">{booking.barber_name_snapshot}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between gap-4">
                                <dt className="text-[#6E6D68]">Jadwal Layanan</dt>
                                <dd className="font-mono tabular-nums font-medium text-[#111110]">{booking.booking_date} pukul {booking.start_time.slice(0, 5)} WIB</dd>
                            </div>
                            <div className="py-2.5 flex justify-between gap-4">
                                <dt className="text-[#6E6D68]">Layanan Dipilih</dt>
                                <dd className="font-medium text-[#111110]">{booking.service_name_snapshot}</dd>
                            </div>
                            <div className="py-2.5 flex justify-between gap-4">
                                <dt className="text-[#6E6D68]">Total Biaya</dt>
                                <dd className="font-mono tabular-nums font-bold text-[#111110]">{formatRupiah(Number(booking.price_snapshot))}</dd>
                            </div>
                            {booking.customer_note && (
                                <div className="py-2.5 flex flex-col gap-1">
                                    <dt className="text-[#6E6D68]">Catatan Pelanggan</dt>
                                    <dd className="text-[#111110] bg-[#F6F5F2] p-2.5 rounded-md border border-[#E4E2DD] mt-1">{booking.customer_note}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Tindakan Cepat Status */}
                    <div className="bg-white border border-[#E4E2DD] rounded-md p-5 space-y-3">
                        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#6E6D68]">
                            Perubahan Status Reservasi
                        </h2>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "confirmed",
                                        title: "Konfirmasi Jadwal Booking",
                                        description: "Slot akan dikunci secara permanen untuk pelanggan ini.",
                                    })
                                }
                                className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Konfirmasi</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "completed",
                                        title: "Tandai Sesi Selesai",
                                        description: "Gunakan ini setelah pelanggan selesai mendapatkan layanan di studio.",
                                    })
                                }
                                className="px-3.5 py-2 rounded-md bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors"
                            >
                                Tandai Selesai
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "cancelled",
                                        title: "Batalkan Reservasi",
                                        description: "Slot waktu akan dibebaskan kembali agar dapat dipesan pelanggan lain.",
                                        requireReason: true,
                                    })
                                }
                                className="px-3.5 py-2 rounded-md bg-white border border-red-200 text-red-700 text-xs font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Batalkan</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setModalAction({
                                        status: "rejected",
                                        title: "Tolak Permintaan Booking",
                                        description: "Permintaan reservasi akan ditolak dan slot dibebaskan.",
                                        requireReason: true,
                                    })
                                }
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#6E6D68] text-xs font-medium hover:bg-[#F6F5F2] hover:text-[#111110] transition-colors"
                            >
                                Tolak
                            </button>
                        </div>
                    </div>

                    {/* Form Reschedule & Catatan Internal */}
                    <div className="bg-white border border-[#E4E2DD] rounded-md p-5 space-y-4">
                        <h2 className="text-xs uppercase tracking-wider font-semibold text-[#6E6D68]">
                            Reschedule Jadwal & Barber
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-[11px] font-medium text-[#6E6D68] block mb-1">
                                    Tanggal Baru
                                </label>
                                <input
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-[#6E6D68] block mb-1">
                                    Jam Mulai
                                </label>
                                <input
                                    type="time"
                                    value={rescheduleTime}
                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-[#6E6D68] block mb-1">
                                    Pilih Barber
                                </label>
                                <select
                                    value={rescheduleBarber}
                                    onChange={(e) => setRescheduleBarber(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
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
                            <label className="text-[11px] font-medium text-[#6E6D68] block mb-1">
                                Catatan Internal Admin
                            </label>
                            <textarea
                                rows={2}
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="Tambahkan catatan internal studio..."
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
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
                            className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors"
                        >
                            Simpan Jadwal & Catatan
                        </button>
                    </div>
                </div>

                {/* Kolom Kanan: Audit Log Riwayat Status */}
                <div className="lg:col-span-5 bg-white border border-[#E4E2DD] rounded-md p-5 h-fit">
                    <h2 className="text-xs uppercase tracking-wider font-semibold text-[#6E6D68] mb-4">
                        Riwayat Perubahan Status
                    </h2>
                    {history.length === 0 ? (
                        <p className="text-xs text-[#6E6D68]">Belum ada riwayat perubahan.</p>
                    ) : (
                        <div className="divide-y divide-[#E4E2DD] text-xs">
                            {history.map((h) => (
                                <div key={h.id} className="py-3 space-y-1">
                                    <div className="flex items-center justify-between font-medium text-[#111110]">
                                        <span className="uppercase font-mono text-[11px]">
                                            {h.old_status ? `${h.old_status} → ` : ""}
                                            <span className="font-bold">{h.new_status}</span>
                                        </span>
                                        <span className="text-[10px] text-[#6E6D68] font-mono tabular-nums">
                                            {new Date(h.created_at).toLocaleString("id-ID")}
                                        </span>
                                    </div>
                                    {h.reason && (
                                        <p className="text-[#6E6D68] text-xs leading-relaxed">{h.reason}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DIALOG KONFIRMASI PERUBAHAN STATUS */}
            {modalAction && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setModalAction(null)}
                >
                    <div
                        className="relative max-w-sm w-full rounded-md bg-white text-[#111110] p-5 shadow-2xl border border-[#E4E2DD]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setModalAction(null)}
                            className="absolute top-4 right-4 text-[#6E6D68] hover:text-[#111110]"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-[#C89D7C]" />
                            <h3 className="text-sm font-bold text-[#111110]">
                                {modalAction.title}
                            </h3>
                        </div>
                        <p className="text-xs text-[#6E6D68] leading-relaxed">
                            {modalAction.description}
                        </p>

                        <div className="mt-4">
                            <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
                                Catatan / Alasan Perubahan{" "}
                                {modalAction.requireReason ? "(Wajib)" : "(Opsional)"}
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Masukkan alasan..."
                                className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                            />
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalAction(null)}
                                className="px-3 py-1.5 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2]"
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
                                className="px-3.5 py-1.5 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28]"
                            >
                                {submitting ? "Memproses..." : "Lanjutkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}