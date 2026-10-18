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
            {/* Header Architectural */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DD] mb-6">
                <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                        Manajemen Ketersediaan
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111110] mt-1">
                        Jadwal Kerja & Hari Libur
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-1">
                        Atur jam buka studio mingguan, waktu istirahat, serta jadwal cuti
                        atau shift khusus masing-masing barber.
                    </p>
                </div>

                {/* Segmented Switcher Tab */}
                <div className="inline-flex p-1 bg-white border border-[#E4E2DD] rounded-md self-start md:self-auto gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab("studio")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeTab === "studio"
                                ? "bg-[#111110] text-white shadow-sm"
                                : "text-[#6E6D68] hover:text-[#111110]"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Jam Studio</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("barber")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeTab === "barber"
                                ? "bg-[#111110] text-white shadow-sm"
                                : "text-[#6E6D68] hover:text-[#111110]"
                        }`}
                    >
                        <CalendarOff className="w-3.5 h-3.5" />
                        <span>Cuti & Shift Barber ({barberSchedules.length})</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white border border-[#E4E2DD] rounded-md p-12 text-center text-xs text-[#6E6D68]">
                    Memuat konfigurasi jadwal dari database...
                </div>
            ) : activeTab === "studio" ? (
                /* ================================================================== */
                /* TAB 1: JAM OPERASIONAL MINGGUAN STUDIO                             */
                /* ================================================================== */
                <div className="space-y-4">
                    <div className="bg-white border border-[#E4E2DD] rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                                Aturan Slot Otomatis
                            </span>
                            <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                Jam Buka, Tutup & Istirahat Mingguan
                            </h2>
                            <p className="text-xs text-[#6E6D68] mt-1">
                                Perubahan jam operasional langsung diterapkan pada perhitungan slot booking pelanggan.
                            </p>
                        </div>

                        <button
                            type="button"
                            disabled={savingStudio}
                            onClick={handleSaveStudioHours}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shrink-0 shadow-sm"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                                {savingStudio ? "Menyimpan..." : "Simpan Jam Operasional"}
                            </span>
                        </button>
                    </div>

                    <div className="bg-white border border-[#E4E2DD] rounded-md divide-y divide-[#E4E2DD] overflow-hidden">
                        {businessHours.map((bh, idx) => (
                            <div
                                key={bh.day_of_week}
                                className={`p-4 transition-colors ${
                                    bh.is_closed ? "bg-[#FBFBFA]" : "hover:bg-[#FAFAF9]"
                                }`}
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                    {/* Nama Hari & Toggle Buka/Tutup */}
                                    <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-4">
                                        <div>
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                                                HARI KE-{bh.day_of_week + 1}
                                            </span>
                                            <h3 className="text-sm font-bold text-[#111110]">
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
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                                                bh.is_closed
                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    bh.is_closed ? "bg-red-500" : "bg-emerald-600"
                                                }`}
                                            />
                                            {bh.is_closed ? "Tutup" : "Buka"}
                                        </button>
                                    </div>

                                    {/* Input Jam Buka & Tutup */}
                                    {!bh.is_closed ? (
                                        <>
                                            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] block mb-1">
                                                        Buka (WIB)
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.open_time.slice(0, 5)}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].open_time = e.target.value;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] block mb-1">
                                                        Tutup (WIB)
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.close_time.slice(0, 5)}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].close_time = e.target.value;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Input Jam Istirahat */}
                                            <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#E4E2DD]">
                                                <div>
                                                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] flex items-center gap-1 mb-1">
                                                        <Coffee className="w-3 h-3 text-[#6E6D68]" /> Istirahat Mulai
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
                                                        className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] flex items-center gap-1 mb-1">
                                                        <Coffee className="w-3 h-3 text-[#6E6D68]" /> Istirahat Selesai
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={bh.break_end ? bh.break_end.slice(0, 5) : ""}
                                                        onChange={(e) => {
                                                            const copy = [...businessHours];
                                                            copy[idx].break_end = e.target.value || null;
                                                            setBusinessHours(copy);
                                                        }}
                                                        className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="lg:col-span-9 text-xs text-[#6E6D68] italic">
                                            Studio diatur tutup pada hari {DAY_NAMES[bh.day_of_week]}. Pelanggan tidak dapat memilih hari ini.
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
                <div className="space-y-4">
                    <div className="bg-white border border-[#E4E2DD] rounded-md p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                                Pengecualian Jadwal Stylist
                            </span>
                            <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                Cuti, Izin, atau Jam Shift Khusus Barber
                            </h2>
                            <p className="text-xs text-[#6E6D68] mt-1">
                                Secara default barber mengikuti jam buka studio. Atur pengecualian untuk tanggal tertentu di sini.
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
                                    is_available: false,
                                    note: "",
                                });
                            }}
                            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shrink-0 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Libur / Shift</span>
                        </button>
                    </div>

                    {barberSchedules.length === 0 ? (
                        <div className="bg-white border border-[#E4E2DD] rounded-md p-8 text-center">
                            <CheckCircle2 className="w-6 h-6 text-[#6E6D68] mx-auto mb-2 opacity-60" />
                            <p className="text-sm font-semibold text-[#111110]">
                                Seluruh Barber Mengikuti Jam Normal Studio
                            </p>
                            <p className="text-xs text-[#6E6D68] mt-1 max-w-md mx-auto">
                                Belum ada catatan hari libur atau perubahan shift khusus barber.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white border border-[#E4E2DD] rounded-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#E4E2DD] bg-[#F6F5F2] text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                            <th className="px-4 py-2.5">Tanggal</th>
                                            <th className="px-4 py-2.5">Barber</th>
                                            <th className="px-4 py-2.5">Status / Shift</th>
                                            <th className="px-4 py-2.5">Catatan</th>
                                            <th className="px-4 py-2.5 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E4E2DD] text-xs">
                                        {barberSchedules.map((bs) => (
                                            <tr key={bs.id} className="hover:bg-[#FAFAF9] transition-colors">
                                                <td className="px-4 py-3 font-mono tabular-nums font-semibold text-[#111110]">
                                                    {bs.schedule_date}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-[#111110]">
                                                    <span className="flex items-center gap-1.5">
                                                        <UserCheck className="w-3.5 h-3.5 text-[#6E6D68]" />
                                                        {getBarberName(bs.barber_id)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                            bs.is_available
                                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                                : "bg-amber-50 text-amber-800 border-amber-200"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${
                                                                bs.is_available ? "bg-emerald-600" : "bg-amber-600"
                                                            }`}
                                                        />
                                                        {bs.is_available
                                                            ? `Shift: ${bs.start_time.slice(0, 5)} – ${bs.end_time.slice(0, 5)}`
                                                            : "Libur / Cuti"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[#6E6D68] max-w-xs truncate">
                                                    {bs.note || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setScheduleModal({ ...bs })}
                                                            className="px-2.5 py-1 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                                                        >
                                                            Ubah
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingSchedule(bs)}
                                                            className="p-1 rounded-md border border-[#E4E2DD] text-[#6E6D68] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                            aria-label="Hapus jadwal khusus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* RIGHT SLIDE-OVER DRAWER: TAMBAH / EDIT JADWAL KHUSUS BARBER */}
            {scheduleModal && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setScheduleModal(null)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-[#E4E2DD] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DD]">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                        Drawer Pengecualian
                                    </span>
                                    <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                        Jadwal Khusus / Cuti Barber
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setScheduleModal(null)}
                                    className="p-1.5 rounded-md text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form id="schedule-drawer-form" onSubmit={handleSaveBarberSchedule} className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
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
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
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
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
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
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div>
                                    <span className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Status Kehadiran
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setScheduleModal({
                                                    ...scheduleModal,
                                                    is_available: false,
                                                })
                                            }
                                            className={`py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                                                !scheduleModal.is_available
                                                    ? "bg-[#111110] text-white border-[#111110]"
                                                    : "bg-white text-[#111110] border-[#E4E2DD] hover:bg-[#F6F5F2]"
                                            }`}
                                        >
                                            Libur / Cuti
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setScheduleModal({
                                                    ...scheduleModal,
                                                    is_available: true,
                                                })
                                            }
                                            className={`py-2 px-3 rounded-md text-xs font-medium border transition-colors ${
                                                scheduleModal.is_available
                                                    ? "bg-[#111110] text-white border-[#111110]"
                                                    : "bg-white text-[#111110] border-[#E4E2DD] hover:bg-[#F6F5F2]"
                                            }`}
                                        >
                                            Masuk Jam Khusus
                                        </button>
                                    </div>
                                </div>

                                {scheduleModal.is_available && (
                                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#F6F5F2] border border-[#E4E2DD] rounded-md">
                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                                Mulai Shift
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
                                                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                                Selesai Shift
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
                                                className="w-full px-2.5 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
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
                                        placeholder="Contoh: Cuti keluarga / Shift siang"
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="pt-4 border-t border-[#E4E2DD] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setScheduleModal(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="schedule-drawer-form"
                                disabled={savingModal}
                                className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors"
                            >
                                {savingModal ? "Menyimpan..." : "Simpan Jadwal"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS JADWAL KHUSUS */}
            {deletingSchedule && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingSchedule(null)}
                >
                    <div
                        className="max-w-md w-full rounded-md bg-white border border-[#E4E2DD] p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-[#111110]">
                            Kembalikan ke Jadwal Normal?
                        </h3>
                        <p className="text-xs text-[#6E6D68] mt-2 leading-relaxed">
                            Pengecualian jadwal untuk{" "}
                            <strong>{getBarberName(deletingSchedule.barber_id)}</strong> pada
                            tanggal <span className="font-mono">{deletingSchedule.schedule_date}</span> akan
                            dihapus dan barber akan mengikuti jam operasional normal studio.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingSchedule(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={savingModal}
                                onClick={confirmDeleteBarberSchedule}
                                className="px-3.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
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