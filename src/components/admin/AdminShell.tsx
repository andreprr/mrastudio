"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    CalendarCheck2,
    Scissors,
    Users,
    Clock,
    Image as ImageIcon,
    MessageSquareQuote,
    Settings,
    LogOut,
    ExternalLink,
} from "lucide-react";

const ADMIN_MENU = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Booking", href: "/admin/bookings", icon: CalendarCheck2 },
    { label: "Layanan & Harga", href: "/admin/services", icon: Scissors },
    { label: "Tim Barber", href: "/admin/team", icon: Users },
    { label: "Jadwal Kerja", href: "/admin/schedule", icon: Clock },
    { label: "Galeri", href: "/admin/gallery", icon: ImageIcon },
    { label: "Ulasan", href: "/admin/reviews", icon: MessageSquareQuote },
    { label: "Pengaturan", href: "/admin/settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-[#141413] text-[#F8F6F1] flex flex-col lg:flex-row">
            {/* Sidebar Editorial Gelap */}
            <aside className="lg:w-72 bg-[#1C1B19] border-b lg:border-b-0 lg:border-r border-white/10 shrink-0 flex flex-col justify-between p-5 lg:p-7">
                <div>
                    <div className="flex items-center justify-between lg:block mb-5 lg:mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#DFC3B0] text-[#141413] flex items-center justify-center font-display font-extrabold text-lg">
                                M
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest text-[#DFC3B0] font-semibold block">
                                    Executive Portal
                                </span>
                                <h2 className="font-display text-xl font-extrabold tracking-tight text-[#F8F6F1]">
                                    MR A Studio
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="lg:hidden px-4 py-2 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-semibold"
                        >
                            Keluar
                        </button>
                    </div>

                    <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                        {ADMIN_MENU.map((item) => {
                            const Icon = item.icon;
                            const active =
                                item.href === "/admin"
                                    ? pathname === "/admin"
                                    : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${active
                                            ? "bg-[#DFC3B0] text-[#141413] shadow-lg"
                                            : "text-[#EAE4DC]/70 hover:bg-white/5 hover:text-[#F8F6F1]"
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="hidden lg:flex flex-col gap-2 pt-6 border-t border-white/10">
                    <Link
                        href="/"
                        target="_blank"
                        className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold text-[#EAE4DC]/80 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span>Lihat Website Publik</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar Sesi Admin</span>
                    </button>
                </div>
            </aside>

            {/* Area Konten Utama dengan Container Krem Hangat */}
            <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-6 sm:p-10 shadow-2xl min-h-[calc(100vh-5rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
}