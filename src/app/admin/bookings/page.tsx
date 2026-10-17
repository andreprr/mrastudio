"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { BookingRecord, BookingStatus } from "@/types/database";
import { formatRupiah } from "@/config/site";
import {
    Search,
    Calendar,
    ArrowUpRight,
    Clock,
    User,
    Filter,
} from "lucide-react";

const STATUS_FILTERS: { value: "all" | BookingStatus; label: string }[] = [
    { value: "all", label: "Semua Status" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rejected", label: "Rejected" },
];

const BADGE_STYLE: Record<BookingStatus, string> = {
    pending: "bg-[#DFC3B0] text-[#141413]",
    confirmed: "bg-emerald-900 text-emerald-100",
    completed: "bg-[#141413] text-[#F8F6F1]",
    cancelled: "bg-red-900/90 text-red-100",
    rejected: "bg-stone-700 text-stone-200",
    expired: "bg-stone-300 text-stone-700",
};

export default function AdminBookingsListPage() {
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        let ignore = false;
        async function fetchBookings() {
            const supabase = createClient();
            const { data } = await supabase
                .from("bookings")
                .select("*")
                .order("booking_date", { ascending: false })
                .order("start_time", { ascending: false });

            if (!ignore) {
                setBookings((data as BookingRecord[]) || []);
                setLoading(false);
            }
        }
        fetchBookings();
        return () => {
            ignore = true;
        };
    }, []);

    const filteredBookings = bookings.filter((b) => {
        const matchesStatus =
            statusFilter === "all" ? true : b.status === statusFilter;
        const matchesDate = dateFilter ? b.booking_date === dateFilter : true;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            b.booking_code.toLowerCase().includes(q) ||
            b.customer_name.toLowerCase().includes(q) ||
            b.customer_phone.toLowerCase().includes(q) ||
            b.service_name_snapshot.toLowerCase().includes(q);

        return matchesStatus && matchesDate && matchesSearch;
    });

    return (
        <AdminShell>
            {/* Header Editorial */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#141413]/10">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                        Manajemen Reservasi
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
                        Daftar Booking Pelanggan
                    </h1>
                </div>
                <div className="text-xs font-semibold px-4 py-2 rounded-full bg-[#EAE4DC] text-[#141413]">
                    Total Ditampilkan: {filteredBookings.length} Reservasi
                </div>
            </div>

            {/* Bar Pencarian & Filter */}
            <div className="my-8 p-6 rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-8 relative">
                        <Search className="w-4 h-4 text-[#706D65] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari Kode Booking (MRA-...), Nama Pelanggan, atau WhatsApp..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8F6F1] border border-[#141413]/15 text-sm focus:outline-none focus:border-[#141413]"
                        />
                    </div>

                    <div className="md:col-span-4 relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Calendar className="w-4 h-4 text-[#706D65] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8F6F1] border border-[#141413]/15 text-sm focus:outline-none focus:border-[#141413]"
                            />
                        </div>
                        {dateFilter && (
                            <button
                                type="button"
                                onClick={() => setDateFilter("")}
                                className="px-3 py-3.5 rounded-2xl bg-[#141413] text-[#F8F6F1] text-xs font-semibold"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Pill Filter Status (Gaya Referensi Paréa) */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#706D65] flex items-center gap-1 mr-2">
                        <Filter className="w-3.5 h-3.5" /> Status:
                    </span>
                    {STATUS_FILTERS.map((st) => {
                        const active = statusFilter === st.value;
                        return (
                            <button
                                key={st.value}
                                type="button"
                                onClick={() => setStatusFilter(st.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${active
                                        ? "bg-[#141413] text-[#F8F6F1] shadow-sm"
                                        : "bg-[#F8F6F1] text-[#141413] border border-[#141413]/15 hover:bg-[#DFC3B0]/50"
                                    }`}
                            >
                                {st.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Daftar Kartu Booking */}
            {loading ? (
                <div className="py-16 text-center text-sm text-[#706D65]">
                    Memuat data reservasi dari database...
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="rounded-[2rem] bg-[#EAE4DC]/40 border border-[#141413]/10 p-12 text-center">
                    <p className="font-display text-lg font-bold">
                        Tidak ada data booking yang cocok.
                    </p>
                    <p className="text-xs text-[#706D65] mt-1">
                        Coba ubah kata kunci pencarian atau reset filter tanggal/status.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredBookings.map((bk) => (
                        <div
                            key={bk.id}
                            className="group rounded-[2rem] bg-[#EAE4DC]/60 hover:bg-[#EAE4DC] border border-[#141413]/10 p-6 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                        >
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-[#141413] text-[#DFC3B0]">
                                        {bk.booking_code}
                                    </span>
                                    <span
                                        className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full ${BADGE_STYLE[bk.status] || "bg-[#EAE4DC]"
                                            }`}
                                    >
                                        {bk.status}
                                    </span>
                                    <span className="text-xs text-[#706D65] flex items-center gap-1 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {bk.booking_date} • {bk.start_time.slice(0, 5)} –{" "}
                                        {bk.end_time.slice(0, 5)} WIB
                                    </span>
                                </div>

                                <h3 className="font-display text-xl font-extrabold text-[#141413]">
                                    {bk.customer_name}{" "}
                                    <span className="text-sm font-sans font-normal text-[#706D65]">
                                        ({bk.customer_phone})
                                    </span>
                                </h3>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-[#3B281E] font-semibold">
                                    <span>Layanan: {bk.service_name_snapshot}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        Barber: {bk.barber_name_snapshot}
                                    </span>
                                </div>
                            </div>

                            <div className="flex sm:flex-row items-center justify-between lg:justify-end gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#141413]/10">
                                <div className="text-left lg:text-right">
                                    <span className="text-[10px] uppercase tracking-widest text-[#706D65] block">
                                        Total Snapshot
                                    </span>
                                    <span className="font-display text-xl font-extrabold text-[#141413]">
                                        {formatRupiah(Number(bk.price_snapshot))}
                                    </span>
                                </div>

                                <Link
                                    href={`/admin/bookings/${bk.id}`}
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shrink-0"
                                >
                                    <span>Kelola Booking</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminShell>
    );
}