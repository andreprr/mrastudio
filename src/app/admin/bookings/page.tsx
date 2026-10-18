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

const STATUS_BADGE_STYLE: Record<BookingStatus, { bg: string; dot: string; text: string; border: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", border: "border-amber-200" },
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500", border: "border-emerald-200" },
    completed: { bg: "bg-zinc-100", text: "text-zinc-800", dot: "bg-zinc-600", border: "border-zinc-200" },
    cancelled: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", border: "border-red-200" },
    rejected: { bg: "bg-stone-100", text: "text-stone-700", dot: "bg-stone-500", border: "border-stone-200" },
    expired: { bg: "bg-stone-50", text: "text-stone-500", dot: "bg-stone-400", border: "border-stone-200" },
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111110]">
                        Daftar Booking Pelanggan
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-0.5">
                        Kelola seluruh reservasi, status verifikasi, dan jadwal pelanggan studio.
                    </p>
                </div>
                <div className="text-xs font-mono tabular-nums text-[#6E6D68] px-2.5 py-1 rounded-md bg-white border border-[#E4E2DD] self-start sm:self-auto">
                    {filteredBookings.length} Reservasi
                </div>
            </div>

            {/* Filter Bar 1 Baris Tipis */}
            <div className="bg-white p-2.5 border border-[#E4E2DD] rounded-md mb-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari Kode (MRA-...), Pelanggan, WhatsApp..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#F6F5F2] border border-[#E4E2DD] text-xs text-[#111110] focus:outline-none focus:bg-white focus:border-[#111110]"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-md bg-[#F6F5F2] border border-[#E4E2DD] text-xs text-[#111110] focus:outline-none focus:bg-white focus:border-[#111110]"
                    />
                    {dateFilter && (
                        <button
                            type="button"
                            onClick={() => setDateFilter("")}
                            className="px-2 py-1 rounded-md bg-white border border-[#E4E2DD] text-[11px] text-[#6E6D68] hover:text-[#111110]"
                        >
                            Reset
                        </button>
                    )}

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | BookingStatus)}
                        className="px-2.5 py-1.5 rounded-md bg-[#F6F5F2] border border-[#E4E2DD] text-xs text-[#111110] focus:outline-none focus:bg-white focus:border-[#111110]"
                    >
                        {STATUS_FILTERS.map((st) => (
                            <option key={st.value} value={st.value}>
                                {st.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* High-Density Data Table */}
            {loading ? (
                <div className="py-16 text-center text-xs text-[#6E6D68] bg-white border border-[#E4E2DD] rounded-md">
                    Memuat data reservasi dari database...
                </div>
            ) : (
                <div className="bg-white border border-[#E4E2DD] rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#E4E2DD] bg-[#F6F5F2]/70 text-[#6E6D68] uppercase text-[10px] tracking-wider font-semibold">
                                    <th className="py-2.5 px-4">KODE</th>
                                    <th className="py-2.5 px-4">PELANGGAN</th>
                                    <th className="py-2.5 px-4">LAYANAN</th>
                                    <th className="py-2.5 px-4">BARBER</th>
                                    <th className="py-2.5 px-4">JADWAL</th>
                                    <th className="py-2.5 px-4">HARGA</th>
                                    <th className="py-2.5 px-4">STATUS</th>
                                    <th className="py-2.5 px-4 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E2DD]">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-10 text-center text-[#6E6D68]">
                                            Tidak ada data booking yang cocok.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((bk) => {
                                        const style = STATUS_BADGE_STYLE[bk.status] || {
                                            bg: "bg-zinc-100",
                                            text: "text-zinc-800",
                                            dot: "bg-zinc-500",
                                            border: "border-zinc-200",
                                        };
                                        return (
                                            <tr key={bk.id} className="hover:bg-[#F6F5F2]/50 transition-colors">
                                                <td className="py-3 px-4 font-mono font-medium text-[#111110] whitespace-nowrap">
                                                    {bk.booking_code}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-[#111110]">{bk.customer_name}</div>
                                                    <div className="text-[11px] text-[#6E6D68] font-mono tabular-nums">{bk.customer_phone}</div>
                                                </td>
                                                <td className="py-3 px-4 text-[#111110] font-medium">
                                                    {bk.service_name_snapshot}
                                                </td>
                                                <td className="py-3 px-4 text-[#6E6D68]">
                                                    {bk.barber_name_snapshot}
                                                </td>
                                                <td className="py-3 px-4 font-mono tabular-nums text-[#111110] whitespace-nowrap">
                                                    <div>{bk.booking_date}</div>
                                                    <div className="text-[11px] text-[#6E6D68]">{bk.start_time.slice(0, 5)} WIB</div>
                                                </td>
                                                <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#111110] whitespace-nowrap">
                                                    {formatRupiah(Number(bk.price_snapshot))}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                                        {bk.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <Link
                                                        href={`/admin/bookings/${bk.id}`}
                                                        className="px-2.5 py-1.5 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                                                    >
                                                        Kelola
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}