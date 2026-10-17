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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold">
                        Ringkasan Operasional
                    </h1>
                    <p className="text-sm text-brand-gray">
                        Data transaksi langsung dari database MR A Studio ({todayJakarta}).
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/bookings"
                        className="px-4 py-2.5 rounded-full bg-brand-charcoal text-brand-cream text-xs font-medium"
                    >
                        Kelola Semua Booking
                    </Link>
                    <Link
                        href="/admin/services"
                        className="px-4 py-2.5 rounded-full border border-brand-charcoal/20 text-xs font-medium"
                    >
                        Ubah Pricelist
                    </Link>
                </div>
            </div>

            {/* Kartu Statistik */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                <div className="p-5 rounded-3xl bg-brand-beige/70 border border-brand-charcoal/10">
                    <span className="text-xs text-brand-gray">Booking Hari Ini</span>
                    <p className="font-display text-3xl font-bold mt-1">
                        {todayBookings.length}
                    </p>
                </div>
                <div className="p-5 rounded-3xl bg-amber-100/70 border border-amber-900/10">
                    <span className="text-xs text-amber-900">Menunggu (Pending)</span>
                    <p className="font-display text-3xl font-bold mt-1 text-amber-950">
                        {pendingCount}
                    </p>
                </div>
                <div className="p-5 rounded-3xl bg-emerald-100/70 border border-emerald-900/10">
                    <span className="text-xs text-emerald-900">Confirmed</span>
                    <p className="font-display text-3xl font-bold mt-1 text-emerald-950">
                        {confirmedCount}
                    </p>
                </div>
                <div className="p-5 rounded-3xl bg-brand-beige/70 border border-brand-charcoal/10">
                    <span className="text-xs text-brand-gray">Selesai (Completed)</span>
                    <p className="font-display text-3xl font-bold mt-1">
                        {completedCount}
                    </p>
                </div>
                <div className="p-5 rounded-3xl bg-red-100/60 border border-red-900/10">
                    <span className="text-xs text-red-900">Dibatalkan</span>
                    <p className="font-display text-3xl font-bold mt-1 text-red-950">
                        {cancelledCount}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Daftar Booking Terbaru */}
                <div className="lg:col-span-8 rounded-3xl bg-brand-beige/50 border border-brand-charcoal/10 p-6">
                    <h2 className="font-display text-lg font-bold mb-4">
                        Booking Terbaru
                    </h2>
                    {bookings.length === 0 ? (
                        <p className="text-sm text-brand-gray py-6">
                            Belum ada data booking yang masuk.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {bookings.slice(0, 6).map((b) => (
                                <div
                                    key={b.id}
                                    className="p-4 rounded-2xl bg-brand-cream flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-brand-charcoal/5"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold">
                                                {b.booking_code}
                                            </span>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-beige font-medium">
                                                {b.status}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-sm mt-1">
                                            {b.customer_name} • {b.service_name_snapshot}
                                        </p>
                                        <p className="text-xs text-brand-gray">
                                            {b.booking_date} pukul {b.start_time.slice(0, 5)} WIB —{" "}
                                            {b.barber_name_snapshot}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-display font-bold text-sm">
                                            {formatRupiah(Number(b.price_snapshot))}
                                        </span>
                                        <Link
                                            href={`/admin/bookings/${b.id}`}
                                            className="px-3.5 py-1.5 rounded-full bg-brand-charcoal text-brand-cream text-xs"
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
                <div className="lg:col-span-4 rounded-3xl bg-brand-beige/50 border border-brand-charcoal/10 p-6">
                    <h2 className="font-display text-lg font-bold mb-4">
                        Layanan Terpopuler
                    </h2>
                    {popularServices.length === 0 ? (
                        <p className="text-sm text-brand-gray">Belum ada statistik layanan.</p>
                    ) : (
                        <div className="space-y-4">
                            {popularServices.map(([name, count]) => (
                                <div
                                    key={name}
                                    className="p-3.5 rounded-2xl bg-brand-cream flex items-center justify-between"
                                >
                                    <span className="text-sm font-medium">{name}</span>
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-peach/50">
                                        {count}x dipesan
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}