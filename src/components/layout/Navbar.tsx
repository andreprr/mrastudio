"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Layanan", href: "/#services" },
    { label: "Tentang Kami", href: "/#about" },
    { label: "Gallery", href: "/#gallery" },
    { label: "Our Team", href: "/#team" },
    { label: "Review", href: "/#reviews" },
    { label: "Cek Booking", href: "/cek-booking" },
];

export function Navbar({ brandName = "MR A Studio" }: { brandName?: string }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll(); // Cek posisi awal saat komponen dimuat
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Jika di-scroll atau menu mobile sedang dibuka, background terang -> teks gelap
    // Jika masih di paling atas (hero gelap/hitam) -> teks putih
    const isLightHeader = scrolled || mobileOpen;

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isLightHeader
                ? "bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#141413]/10 py-2.5 sm:py-3.5 shadow-sm"
                : "bg-gradient-to-b from-black/70 to-transparent py-3.5 sm:py-5"
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
                >
                    <img
                        src="/Logo Mister A Font.png"
                        alt={brandName}
                        loading="eager"
                        decoding="async"
                        className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-6">
                    {NAV_LINKS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-semibold transition-colors duration-200 ${isLightHeader
                                ? "text-[#141413]/80 hover:text-[#dd3e1f]"
                                : "text-[#F8F6F1]/90 hover:text-[#dd3e1f] drop-shadow-xs"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA Button */}
                <div className="hidden lg:flex items-center gap-3">
                    <Link
                        href="/booking"
                        className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all duration-300 ${isLightHeader
                            ? "bg-[#141413] text-[#FFFFFF] border-[#141413] hover:bg-[#dd3e1f] hover:border-[#dd3e1f]"
                            : "bg-[#F8F6F1] text-[#141413] border-[#FFFFFF] hover:bg-[#dd3e1f] hover:text-white hover:border-[#dd3e1f]"
                            }`}
                    >
                        Booking Sekarang
                    </Link>
                </div>

                {/* Hamburger Mobile dengan Animasi Putar (Rotate & Scale) */}
                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Buka menu navigasi"
                    aria-expanded={mobileOpen}
                    className={`lg:hidden relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer ${isLightHeader
                        ? "bg-white border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white"
                        : "bg-black/40 backdrop-blur-sm border-white/80 text-white hover:bg-white hover:text-[#141413]"
                        }`}
                >
                    <Menu
                        className={`w-5 h-5 absolute transition-all duration-300 ease-out ${mobileOpen
                            ? "opacity-0 rotate-90 scale-50"
                            : "opacity-100 rotate-0 scale-100"
                            }`}
                    />
                    <X
                        className={`w-5 h-5 absolute transition-all duration-300 ease-out ${mobileOpen
                            ? "opacity-100 rotate-0 scale-100"
                            : "opacity-0 -rotate-90 scale-50"
                            }`}
                    />
                </button>
            </div>

            {/* Mobile Drawer dengan Animasi Buka/Tutup Halus */}
            <div
                className={`lg:hidden grid transition-all duration-300 ease-in-out ${mobileOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
            >
                <div className="overflow-hidden">
                    <div className="bg-[#FFFFFFF] border-b border-[#141413]/15 px-6 pt-4 pb-8 space-y-5 shadow-xl">
                        <div className="flex flex-col space-y-1">
                            {NAV_LINKS.map((item, idx) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        transitionDelay: mobileOpen ? `${idx * 40}ms` : "0ms",
                                    }}
                                    className={`py-2.5 text-base font-semibold text-[#141413] hover:text-[#dd3e1f] border-b border-[#141413]/10 transition-all duration-300 ${mobileOpen
                                        ? "translate-x-0 opacity-100"
                                        : "-translate-x-4 opacity-0"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <Link
                            href="/booking"
                            onClick={() => setMobileOpen(false)}
                            className={`block w-full text-center py-3.5 rounded-full bg-[#141413] text-[#FFFFFF] font-bold border-2 border-[#141413] hover:bg-[#dd3e1f] hover:border-[#dd3e1f] shadow-md transition-all duration-300 ${mobileOpen
                                ? "translate-y-0 opacity-100 delay-200"
                                : "translate-y-3 opacity-0"
                                }`}
                        >
                            Booking Sekarang
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}