"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Scissors } from "lucide-react";

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
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-brand-cream/95 backdrop-blur-md border-b border-brand-charcoal/10 py-3.5"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link
                    href="/"
                    className="font-display text-xl sm:text-2xl font-bold tracking-tight text-brand-charcoal flex items-center gap-2"
                >
                    <span className="w-8 h-8 rounded-full bg-brand-charcoal text-brand-cream flex items-center justify-center">
                        <Scissors className="w-4 h-4" />
                    </span>
                    <span>{brandName}</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-8">
                    {NAV_LINKS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-brand-charcoal/80 hover:text-brand-charcoal transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-3">
                    <Link
                        href="/booking"
                        className="px-5 py-2.5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium hover:bg-brand-espresso transition-colors"
                    >
                        Booking Sekarang
                    </Link>
                </div>

                {/* Hamburger Mobile */}
                <button
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Buka menu navigasi"
                    className="lg:hidden p-2.5 rounded-full bg-brand-beige/80 text-brand-charcoal"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="lg:hidden bg-brand-cream border-b border-brand-charcoal/15 px-6 pt-4 pb-8 space-y-4 shadow-xl">
                    <div className="flex flex-col space-y-3">
                        {NAV_LINKS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="py-2 text-base font-medium text-brand-charcoal border-b border-brand-charcoal/5"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <Link
                        href="/booking"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full text-center py-3.5 rounded-full bg-brand-charcoal text-brand-cream font-medium"
                    >
                        Booking Sekarang
                    </Link>
                </div>
            )}
        </header>
    );
}