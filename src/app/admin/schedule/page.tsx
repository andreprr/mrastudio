"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { BusinessHour, BarberSchedule, BarberItem } from "@/types/database";
import { toast } from "sonner";
import {
    Clock,
    CalendarOff,
    Plus,
    Save,
    Trash2,
    X,
    Sparkles,
    Coffee,
    CheckCircle2,
    UserCheck,
} from "lucide-react";

const DAY_NAMES = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
];

export default function AdminSchedulePage() {
    const [activeTab, setActiveTab] = useState<"studio" | "barber">("studio");
    const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
    const [barbers, setBarbers] = useState<BarberItem[]>([]);
    const [barberSchedules, setBarberSchedules] = useState<BarberSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingStudio, setSavingStudio] = useState(false);

    // Modal State untuk Tambah / Edit Jadwal Khusus atau Hari Libur Barber
    const [scheduleModal, setScheduleModal] =
        useState<Partial<BarberSchedule> | null>(null);
    // Modal State untuk Konfirmasi Hapus Jadwal Khusus
    const [deletingSchedule, setDeletingSchedule] =
        useState<BarberSchedule | null>(null);
    const [savingModal, setSavingModal] = useState(false);

    const refreshData = useCallback(async () => {
        const supabase = createClient();
        const [{ data: bhData }, { data: brbData }, { data: bsData }] =
            await Promise.all([
                supabase
                    .from("business_hours")
                    .select("*")
                    .order("day_of_week", { ascending: true }),
                supabase
                    .from("barbers")
                    .select("*")
                    .order("name", { ascending: true }),
                supabase
                    .from("barber_schedules")
                    .select("*")
                    .order("schedule_date", { ascending: false }),
            ]);

        // Jika tabel business_hours masih kosong, siapkan kerangka 7 hari default
        if (!bhData || bhData.length === 0) {
            const fallbackDays: BusinessHour[] = Array.from({ length: 7 }).map(
                (_, idx) => ({
                    id: `temp-${idx}`,
                    day_of_week: idx,
                    open_time: "10:00:00",
                    close_time: "21:00:00",
                    is_closed: false,
                    break_start: "12:00:00",
                    break_end: "13:00:00",
                })
            );
            setBusinessHours(fallbackDays);
        } else {
            setBusinessHours(bhData as BusinessHour[]);
        }

        setBarbers((brbData as BarberItem[]) || []);
        setBarberSchedules((bsData as BarberSchedule[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function initFetch() {
            const supabase = createClient();
            const [{ data: bhData }, { data: brbData }, { data: bsData }] =
                await Promise.all([
                    supabase
                        .from("business_hours")
                        .select("*")
                        .order("day_of_week", { ascending: true }),
                    supabase
                        .from("barbers")
                        .select("*")
                        .order("name", { ascending: true }),
                    supabase
                        .from("barber_schedules")
                        .select("*")
                        .order("schedule_date", { ascending: false }),
                ]);

            if (ignore) return;

            if (!bhData || bhData.length === 0) {
                const fallbackDays: BusinessHour[] = Array.from({ length: 7 }).map(
                    (_, idx) => ({
                        id: `temp-${idx}`,
                        day_of_week: idx,
                        open_time: "10:00:00",
                        close_time: "21:00:00",
                        is_closed: false,
                        break_start: "12:00:00",
                        break_end: "13:00:00",
                    })
                );
                setBusinessHours(fallbackDays);
            } else {
                setBusinessHours(bhData as BusinessHour[]);
            }

            setBarbers((brbData as BarberItem[]) || []);
            setBarberSchedules((bsData as BarberSchedule[]) || []);
            setLoading(false);
        }

        initFetch();
        return () => {
            ignore = true;
        };
    }, []);

    // Simpan Seluruh Jam Operasional Mingguan Studio
    async function handleSaveStudioHours() {
        setSavingStudio(true);
        try {
            const supabase = createClient();
            const payload = businessHours.map((bh) => ({
                day_of_week: bh.day_of_week,
                open_time: bh.open_time.slice(0, 5),
                close_time: bh.close_time.slice(0, 5),
                is_closed: bh.is_closed,
                break_start: bh.break_start ? bh.break_start.slice(0, 5) : null,
                break_end: bh.break_end ? bh.break_end.slice(0, 5) : null,
            }));

            const { error } = await supabase
                .from("business_hours")
                .upsert(payload, { onConflict: "day_of_week" });

            if (error) {
                toast.error("Gagal menyimpan jam operasional: " + error.message);
                return;
            }

            toast.success("Jam operasional mingguan studio berhasil diperbarui!");
            await refreshData();
        } finally {
            setSavingStudio(false);
        }
    }

    // Simpan Jadwal Khusus / Libur Barber (Upsert berdasarkan barber_id + schedule_date)
    async function handleSaveBarberSchedule(e: React.FormEvent) {
        e.preventDefault();
        if (!scheduleModal?.barber_id || !scheduleModal?.schedule_date) {
            toast.error("Pilih barber dan tanggal terlebih dahulu.");
            return;
        }

        setSavingModal(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("barber_schedules").upsert(
                {
                    barber_id: scheduleModal.barber_id,
                    schedule_date: scheduleModal.schedule_date,
                    start_time: (scheduleModal.start_time || "10:00").slice(0, 5),
                    end_time: (scheduleModal.end_time || "21:00").slice(0, 5),
                    is_available: scheduleModal.is_available ?? false,
                    note: scheduleModal.note || null,
                },
                { onConflict: "barber_id,schedule_date" }
            );

            if (error) {
                toast.error("Gagal menyimpan jadwal barber: " + error.message);
                return;
            }

            toast.success("Jadwal khusus / cuti barber berhasil disimpan!");
            setScheduleModal(null);
            await refreshData();
        } finally {
            setSavingModal(false);
        }
    }

    async function confirmDeleteBarberSchedule() {
        if (!deletingSchedule) return;
        setSavingModal(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("barber_schedules")
                .delete()
                .eq("id", deletingSchedule.id);

            if (error) {
                toast.error("Gagal menghapus jadwal khusus.");
                return;
            }

            toast.success("Jadwal khusus dihapus. Barber kembali ke jam normal.");
            setDeletingSchedule(null);
            await refreshData();
        } finally {
            setSavingModal(false);
        }
    }

    function getBarberName(barberId: string) {
        return (
            barbers.find((b) => b.id === barberId)?.name || "Barber Tidak Dikenal"
        );
    }

    return (
        <AdminShell>
            {/* Header Editorial */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#141413]/10 mb-8">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                        Manajemen Ketersediaan
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
                        Jadwal Kerja & Hari Libur
                    </h1>
                    <p className="text-xs sm:text-sm text-[#706D65] mt-1">
                        Atur jam buka studio mingguan, waktu istirahat, serta jadwal cuti
                        atau shift khusus masing-masing barber.
                    </p>
                </div>

                {/* Switcher Tab Pill ala Referensi Paréa */}
                <div className="inline-flex p-1.5 rounded-full bg-[#EAE4DC] border border-[#141413]/10 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("studio")}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "studio"
                                ? "bg-[#141413] text-[#F8F6F1] shadow-md"
                                : "text-[#141413]/70 hover:text-[#141413]"
                            }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Jam Studio</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("barber")}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === "barber"
                                ? "bg-[#141413] text-[#F8F6F1] shadow-md"
                                : "text-[#141413]/70 hover:text-[#141413]"
                            }`}
                    >
                        <CalendarOff className="w-3.5 h-3.5" />
                        <span>Cuti & Shift Barber ({barberSchedules.length})</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-[#706D65] py-12 text-center">
                    Memuat konfigurasi jadwal dari database...
                </p>
            ) : activeTab === "studio" ? (
                /* ================================================================== */
                /* TAB 1: JAM OPERASIONAL MINGGUAN STUDIO                             */
                /* ================================================================== */
                <div className="space-y-6">
                    <div className="rounded-[2rem] bg-[#141413] text-[#F8F6F1] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#DFC3B0] block">
                                Aturan Slot Otomatis
                            </span>
                            <h2 className="font-display text-xl sm:text-2xl font-extrabold mt-1">
                                Jam Buka, Tutup & Istirahat Mingguan
                            </h2>
                            <p className="text-xs text-[#EAE4DC]/75 mt-1">
                                Perubahan jam operasional langsung diterapkan pada perhitungan
                                slot di halaman booking pelanggan tanpa menghapus booking lama.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={savingStudio}
                            onClick={handleSaveStudioHours}
                            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#DFC3B0] text-[#141413] text-xs font-extrabold uppercase tracking-wider hover:bg-white transition-colors shrink-0 shadow-lg"
                        >
                            <Save className="w-4 h-4" />
                            <span>
                                {savingStudio ? "Menyimpan..." : "Simpan Jam Operasional"}
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {businessHours.map((bh, idx) => (
                            <div
                                key={bh.day_of_week}
                                className={`rounded-[2rem] p-6 border transition-all ${bh.is_closed
                                        ? "bg-[#EAE4DC]/30 border-[#141413]/10 opacity-75"
                                        : "bg-[#EAE4DC]/70 border-[#141413]/15"
                                    }`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                    {/* Nama Hari & Toggle Buka/Tutup */}
                                    <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-4">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#706D65] block">
                                                Hari ke-{bh.day_of_week + 1}
                                            </span>
                                            <h3 className="font-display text-xl font-extrabold text-[#141413]">
                                                {DAY_NAMES[bh.day_of_week]}
                                            </h3>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const copy = [...businessHours];
                                                copy[idx].is_closed = !copy[idx].is_closed;
                                                setBusinessHours(copy);
                                            }}
                                            className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-colors ${bh.is_closed
                                                    ? "bg-red-900/90 text-red-100"
                                                    : "bg-emerald-900 text-emerald-100"
                                                }`}
                                        >
                                            {bh.is_closed ? "Tutup / Libur" : "Studio Buka"}
                                        </button>
                                    </div>

                                    {/* Input Jam Buka & Tutup */}
                                    {!bh.is_closed ? (
                                        <>
                                            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#3B281E] block mb-1">
                                                        Jam Buka (WIB)
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.open_time.slice(0, 5)}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].open_time = e.target.value;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-bold"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#3B281E] block mb-1">
                                                        Jam Tutup (WIB)
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.close_time.slice(0, 5)}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].close_time = e.target.value;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-bold"
                                                    />
                                                </div>
                                            </div>

                                            {/* Input Jam Istirahat */}
                                            <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#141413]/10">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706D65] flex items-center gap-1 mb-1">
                                                        <Coffee className="w-3 h-3" /> Mulai Istirahat
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={
                                                            bh.break_start ? bh.break_start.slice(0, 5) : ""
                                                        }
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].break_start = e.target.value || null;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706D65] flex items-center gap-1 mb-1">
                                                        <Coffee className="w-3 h-3" /> Selesai Istirahat
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.break_end ? bh.break_end.slice(0, 5) : ""}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].break_end = e.target.value || null;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="lg:col-span-9 text-xs text-[#706D65] italic">
                                            Studio diatur tutup pada hari {DAY_NAMES[bh.day_of_week]}.
                                            Pelanggan tidak dapat memilih tanggal pada hari ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ================================================================== */
                /* TAB 2: JADWAL KHUSUS & HARI LIBUR BARBER                           */
                /* ================================================================== */
                <div className="space-y-6">
                    <div className="rounded-[2rem] bg-[#EAE4DC]/80 border border-[#141413]/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E] block">
                                Pengecualian Jadwal Stylist
                            </span>
                            <h2 className="font-display text-2xl font-extrabold mt-1">
                                Cuti, Izin, atau Jam Shift Khusus Barber
                            </h2>
                            <p className="text-xs text-[#706D65] mt-1">
                                Secara default, seluruh barber aktif mengikuti jam buka studio.
                                Tambahkan jadwal di sini jika ada barber yang libur atau masuk
                                di jam berbeda pada tanggal tertentu.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date().toLocaleDateString("en-CA", {
                                    timeZone: "Asia/Jakarta",
                                });
                                setScheduleModal({
                                    barber_id: barbers[0]?.id || "",
                                    schedule_date: today,
                                    start_time: "10:00",
                                    end_time: "21:00",
                                    is_available: false, // Default untuk mencatat libur/cuti
                                    note: "",
                                });
                            }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shrink-0 shadow-md"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Libur / Shift Barber</span>
                        </button>
                    </div>

                    {barberSchedules.length === 0 ? (
                        <div className="rounded-[2rem] bg-[#EAE4DC]/40 border border-[#141413]/10 p-12 text-center">
                            <CheckCircle2 className="w-8 h-8 text-[#3B281E] mx-auto mb-3 opacity-80" />
                            <p className="font-display text-lg font-bold text-[#141413]">
                                Seluruh Barber Mengikuti Jam Normal Studio
                            </p>
                            <p className="text-xs text-[#706D65] mt-1 max-w-md mx-auto">
                                Belum ada catatan hari libur atau perubahan shift khusus barber.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {barberSchedules.map((bs) => (
                                <div
                                    key={bs.id}
                                    className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-6 flex flex-col justify-between gap-4"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-[#141413] text-[#DFC3B0]">
                                                {bs.schedule_date}
                                            </span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${bs.is_available
                                                        ? "bg-emerald-900 text-emerald-100"
                                                        : "bg-red-900 text-red-100"
                                                    }`}
                                            >
                                                {bs.is_available
                                                    ? `Shift Khusus (${bs.start_time.slice(0, 5)} – ${bs.end_time.slice(0, 5)})`
                                                    : "Libur / Cuti Seharian"}
                                            </span>
                                        </div>

                                        <h3 className="font-display text-xl font-extrabold text-[#141413] flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-[#3B281E]" />
                                            <span>{getBarberName(bs.barber_id)}</span>
                                        </h3>

                                        {bs.note && (
                                            <p className="text-xs text-[#706D65] mt-2 leading-relaxed">
                                                Catatan: &ldquo;{bs.note}&rdquo;
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-[#141413]/10 flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setScheduleModal({ ...bs })}
                                            className="px-4 py-2 rounded-full bg-[#F8F6F1] border border-[#141413]/15 text-xs font-bold uppercase tracking-wider hover:bg-[#DFC3B0]/50 transition-colors"
                                        >
                                            Ubah
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingSchedule(bs)}
                                            className="p-2 rounded-full bg-red-500/10 text-red-800 hover:bg-red-600 hover:text-white transition-colors"
                                            aria-label="Hapus jadwal khusus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL TAMBAH / EDIT JADWAL KHUSUS BARBER */}
            {scheduleModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setScheduleModal(null)}
                >
                    <div
                        className="relative max-w-lg w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-7 sm:p-9 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setScheduleModal(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#EAE4DC] flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFC3B0]/60 text-[#3B281E] text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Atur Ketersediaan Barber</span>
                        </div>

                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                            Jadwal Khusus / Hari Libur
                        </h2>

                        <form onSubmit={handleSaveBarberSchedule} className="mt-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Pilih Barber *
                                    </label>
                                    <select
                                        required
                                        value={scheduleModal.barber_id || ""}
                                        onChange={(e) =>
                                            setScheduleModal({
                                                ...scheduleModal,
                                                barber_id: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    >
                                        <option value="" disabled>
                                            -- Pilih Barber --
                                        </option>
                                        {barbers.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Tanggal *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={scheduleModal.schedule_date || ""}
                                        onChange={(e) =>
                                            setScheduleModal({
                                                ...scheduleModal,
                                                schedule_date: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Pilihan Status: Libur Seharian vs Shift Jam Khusus */}
                            <div className="p-4 rounded-2xl bg-[#EAE4DC]/70 space-y-3">
                                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E]">
                                    Status Kehadiran pada Tanggal Tersebut
                                </span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setScheduleModal({
                                                ...scheduleModal,
                                                is_available: false,
                                            })
                                        }
                                        className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${!scheduleModal.is_available
                                                ? "bg-red-900 text-white border-red-900 shadow-sm"
                                                : "bg-[#F8F6F1] text-[#141413] border-[#141413]/15"
                                            }`}
                                    >
                                        Libur / Cuti Seharian
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setScheduleModal({
                                                ...scheduleModal,
                                                is_available: true,
                                            })
                                        }
                                        className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${scheduleModal.is_available
                                                ? "bg-[#141413] text-[#F8F6F1] border-[#141413] shadow-sm"
                                                : "bg-[#F8F6F1] text-[#141413] border-[#141413]/15"
                                            }`}
                                    >
                                        Masuk Jam Khusus
                                    </button>
                                </div>
                            </div>

                            {/* Jika Masuk Jam Khusus, Tampilkan Jam Mulai & Jam Selesai */}
                            {scheduleModal.is_available && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                            Jam Mulai Shift
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={(scheduleModal.start_time || "10:00").slice(0, 5)}
                                            onChange={(e) =>
                                                setScheduleModal({
                                                    ...scheduleModal,
                                                    start_time: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                            Jam Selesai Shift
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={(scheduleModal.end_time || "21:00").slice(0, 5)}
                                            onChange={(e) =>
                                                setScheduleModal({
                                                    ...scheduleModal,
                                                    end_time: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                    Catatan Keterangan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={scheduleModal.note || ""}
                                    onChange={(e) =>
                                        setScheduleModal({
                                            ...scheduleModal,
                                            note: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Cuti keluarga / Masuk shift siang mulai 13:00"
                                    className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setScheduleModal(null)}
                                    className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase tracking-wider"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingModal}
                                    className="px-7 py-3 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E]"
                                >
                                    {savingModal ? "Menyimpan..." : "Simpan Jadwal"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS JADWAL KHUSUS */}
            {deletingSchedule && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingSchedule(null)}
                >
                    <div
                        className="max-w-md w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-display text-2xl font-extrabold">
                            Kembalikan ke Jadwal Normal?
                        </h3>
                        <p className="text-xs text-[#706D65] mt-2 leading-relaxed">
                            Pengecualian jadwal untuk{" "}
                            <strong>{getBarberName(deletingSchedule.barber_id)}</strong> pada
                            tanggal <strong>{deletingSchedule.schedule_date}</strong> akan
                            dihapus dan barber akan mengikuti jam operasional normal studio.
                        </p>
                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingSchedule(null)}
                                className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={savingModal}
                                onClick={confirmDeleteBarberSchedule}
                                className="px-6 py-3 rounded-full bg-red-700 text-white text-xs font-bold uppercase hover:bg-red-800"
                            >
                                {savingModal ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}