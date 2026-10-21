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
        <div className="min-h-screen bg-[#FFFFFF] text-[#111110] flex flex-col lg:flex-row font-sans">
            {/* Sidebar Ramping Swiss Architectural */}
            <aside className="lg:w-56 bg-[#111110] text-[#FFFFFF] border-b lg:border-b-0 lg:border-r border-white/10 shrink-0 flex flex-col justify-between p-4 lg:p-5">
                <div>
                    <div className="flex items-center justify-between lg:block mb-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-md bg-[#dd3e1f] text-[#111110] flex items-center justify-center font-display font-extrabold text-sm">
                                M
                            </div>
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-[#dd3e1f] font-semibold block">
                                    Backoffice
                                </span>
                                <h2 className="font-display text-base font-bold tracking-tight text-white">
                                    MR A Studio
                                </h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="lg:hidden px-2.5 py-1.5 rounded-md bg-white/10 text-white/80 hover:bg-white/20 text-xs font-medium"
                        >
                            Keluar
                        </button>
                    </div>

                    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
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
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${active
                                        ? "bg-white/10 text-white border-l-2 border-[#dd3e1f]"
                                        : "text-[#6E6D68] hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="hidden lg:flex flex-col gap-1 pt-4 border-t border-white/10">
                    <Link
                        href="/"
                        target="_blank"
                        className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-[#6E6D68] hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <span>Website Publik</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Sesi</span>
                    </button>
                </div>
            </aside>

            {/* Area Konten Utama Bersih Tanpa Wrapper Kapsul */}
            <main className="flex-1 bg-[#F6F5F2] text-[#111110] min-h-screen">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}