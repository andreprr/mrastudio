import Link from "next/link";
import { requireAdminServer } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatRupiah } from "@/config/site";


export default async function AdminDashboardPage() {
    const { supabase } = await requireAdminServer();

    const todayJakarta = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
    });

    const { data: allBookings } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    const bookings = allBookings || [];
    const todayBookings = bookings.filter((b) => b.booking_date === todayJakarta);
    const pendingCount = bookings.filter((b) => b.status === "pending").length;
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

    // Hitung ringkasan layanan terpopuler
    const serviceCounter: Record<string, number> = {};
    bookings.forEach((b) => {
        serviceCounter[b.service_name_snapshot] =
            (serviceCounter[b.service_name_snapshot] || 0) + 1;
    });
    const popularServices = Object.entries(serviceCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

    return (
        <AdminShell>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111110]">
                        Ringkasan Operasional
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-0.5">
                        Data transaksi langsung dari database MR A Studio ({todayJakarta}).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/bookings"
                        className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors"
                    >
                        Kelola Semua Booking
                    </Link>
                    <Link
                        href="/admin/services"
                        className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                    >
                        Pricelist
                    </Link>
                </div>
            </div>

            {/* Architectural Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 bg-white border border-[#E4E2DD] rounded-md divide-y lg:divide-y-0 lg:divide-x divide-[#E4E2DD] mb-8">
                <div className="p-4">
                    <span className="text-[11px] uppercase tracking-wider text-[#6E6D68] font-medium block">
                        Hari Ini
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#111110] mt-1">
                        {todayBookings.length}
                    </p>
                </div>
                <div className="p-4">
                    <span className="text-[11px] uppercase tracking-wider text-amber-700 font-medium block">
                        Menunggu (Pending)
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-amber-900 mt-1">
                        {pendingCount}
                    </p>
                </div>
                <div className="p-4">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-medium block">
                        Confirmed
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-emerald-900 mt-1">
                        {confirmedCount}
                    </p>
                </div>
                <div className="p-4">
                    <span className="text-[11px] uppercase tracking-wider text-[#6E6D68] font-medium block">
                        Selesai
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-[#111110] mt-1">
                        {completedCount}
                    </p>
                </div>
                <div className="p-4">
                    <span className="text-[11px] uppercase tracking-wider text-red-700 font-medium block">
                        Dibatalkan
                    </span>
                    <p className="text-2xl font-bold font-mono tabular-nums text-red-800 mt-1">
                        {cancelledCount}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Daftar Booking Terbaru - Tabel Data Padat */}
                <div className="lg:col-span-8 bg-white border border-[#E4E2DD] rounded-md overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#E4E2DD] flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#111110]">
                            Booking Terbaru
                        </h2>
                        <Link
                            href="/admin/bookings"
                            className="text-xs text-[#6E6D68] hover:text-[#111110] font-medium"
                        >
                            Lihat Semua &rarr;
                        </Link>
                    </div>
                    {bookings.length === 0 ? (
                        <p className="text-xs text-[#6E6D68] p-5 text-center">
                            Belum ada data booking yang masuk.
                        </p>
                    ) : (
                        <div className="divide-y divide-[#E4E2DD]">
                            {bookings.slice(0, 6).map((b) => (
                                <div
                                    key={b.id}
                                    className="p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F5F2] transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold text-[#111110]">
                                                {b.booking_code}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                                b.status === "confirmed"
                                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                    : b.status === "pending"
                                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                                    : b.status === "completed"
                                                    ? "bg-zinc-100 text-zinc-800 border-zinc-200"
                                                    : "bg-red-50 text-red-800 border-red-200"
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    b.status === "confirmed"
                                                        ? "bg-emerald-500"
                                                        : b.status === "pending"
                                                        ? "bg-amber-500"
                                                        : b.status === "completed"
                                                        ? "bg-zinc-500"
                                                        : "bg-red-500"
                                                }`} />
                                                {b.status}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-[#111110] mt-1 truncate">
                                            {b.customer_name} <span className="text-[#6E6D68] font-normal">• {b.service_name_snapshot}</span>
                                        </p>
                                        <p className="text-[11px] text-[#6E6D68] font-mono tabular-nums mt-0.5">
                                            {b.booking_date} • {b.start_time.slice(0, 5)} WIB — {b.barber_name_snapshot}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <span className="font-mono tabular-nums text-xs font-semibold text-[#111110]">
                                            {formatRupiah(Number(b.price_snapshot))}
                                        </span>
                                        <Link
                                            href={`/admin/bookings/${b.id}`}
                                            className="px-2.5 py-1 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2]"
                                        >
                                            Detail
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Layanan Populer */}
                <div className="lg:col-span-4 bg-white border border-[#E4E2DD] rounded-md p-5 flex flex-col justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-[#111110] mb-4">
                            Layanan Terpopuler
                        </h2>
                        {popularServices.length === 0 ? (
                            <p className="text-xs text-[#6E6D68]">Belum ada statistik layanan.</p>
                        ) : (
                            <div className="divide-y divide-[#E4E2DD]">
                                {popularServices.map(([name, count]) => (
                                    <div
                                        key={name}
                                        className="py-2.5 flex items-center justify-between text-xs"
                                    >
                                        <span className="font-medium text-[#111110] truncate pr-2">{name}</span>
                                        <span className="font-mono tabular-nums text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F6F5F2] text-[#6E6D68] border border-[#E4E2DD] shrink-0">
                                            {count} pesanan
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}