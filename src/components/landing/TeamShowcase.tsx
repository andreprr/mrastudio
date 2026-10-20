"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BarberItem } from "@/types/database";
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    Plus,
    Scissors,
} from "lucide-react";

export function TeamShowcase({ barbers }: { barbers: BarberItem[] }) {
    const [selectedBarber, setSelectedBarber] = useState<BarberItem | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isHovered || selectedBarber !== null || !barbers || barbers.length === 0) return;

        const interval = setInterval(() => {
            if (!scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            const { scrollLeft, clientWidth, scrollWidth } = container;

            if (scrollLeft + clientWidth >= scrollWidth - 10) {
                container.scrollTo({ left: 0, behavior: "smooth" });
                setActiveIndex(0);
            } else {
                container.scrollBy({ left: 296, behavior: "smooth" });
                setActiveIndex((prev) => (prev + 1) % barbers.length);
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [isHovered, selectedBarber, barbers?.length]);

    if (!barbers || barbers.length === 0) {
        return (
            <div className="rounded-2xl border border-[#141413]/10 bg-[#EAE4DC]/40 p-8 text-center">
                <p className="font-display text-lg font-bold text-[#141413]">
                    Profil tim barber belum ditambahkan.
                </p>
                <p className="text-sm text-[#706D65] mt-1">
                    Silakan tambahkan foto dan profil barber melalui menu Admin &gt; Tim Barber.
                </p>
            </div>
        );
    }

    function scrollByCard(direction: "left" | "right") {
        if (!scrollContainerRef.current) return;
        const amount = 296;
        scrollContainerRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
        setActiveIndex((prev) => {
            if (direction === "left") return Math.max(0, prev - 1);
            return Math.min(barbers.length - 1, prev + 1);
        });
    }

    return (
        <div className="relative">
            {/* Keyframes untuk efek garis border berputar */}
            <style jsx>{`
                @keyframes rotateBorder {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
                .rotating-border-wrapper {
                    position: relative;
                    overflow: hidden;
                    border-radius: 1rem;
                }
                .rotating-border-wrapper::before {
                    content: '';
                    position: absolute;
                    inset: -50%;
                    background: conic-gradient(
                        from 0deg,
                        transparent 0deg,
                        transparent 280deg,
                        #dd3e1f 320deg,
                        #ffffff 360deg
                    );
                    animation: rotateBorder 4s linear infinite;
                    z-index: 1;
                }
                .rotating-border-inner {
                    position: relative;
                    z-index: 2;
                    background: #141413;
                    border-radius: inherit;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                /* Versi kecil untuk badge specialty */
                .rotating-badge {
                    position: relative;
                    overflow: hidden;
                    border-radius: 9999px;
                }
                .rotating-badge::before {
                    content: '';
                    position: absolute;
                    inset: -100%;
                    background: conic-gradient(
                        from 0deg,
                        transparent 0deg,
                        transparent 240deg,
                        #dd3e1f 320deg,
                        #ffffff 360deg
                    );
                    animation: rotateBorder 3s linear infinite;
                    z-index: 1;
                }
                .rotating-badge-inner {
                    position: relative;
                    z-index: 2;
                    background: rgba(20, 20, 19, 0.85);
                    border-radius: inherit;
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#dd3e1f] ring-4 ring-[#dd3e1f]/30 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                            Active Stylists
                        </span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413] tracking-tight">
                        Our Team ({barbers.length})
                    </h2>
                    <p className="text-xs sm:text-sm text-[#706D65] mt-1">
                        Klik kartu profil barber untuk melihat detail dan memilih jadwal potong.
                    </p>
                </div>

                {/* Navigasi Kanan Atas */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => scrollByCard("left")}
                        aria-label="Geser ke kiri"
                        className="w-10 h-10 rounded-full bg-white border-2 border-[#141413] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollByCard("right")}
                        aria-label="Geser ke kanan"
                        className="w-10 h-10 rounded-full bg-white border-2 border-[#141413] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Horizontal Carousel */}
            <div
                ref={scrollContainerRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: "none" }}
            >
                {barbers.map((barber, idx) => (
                    <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        style={{ "--i": idx } as React.CSSProperties}
                        className="rotating-border-wrapper snap-center shrink-0 w-[260px] sm:w-[280px] h-[340px] p-[2px] cursor-pointer group shadow-md hover:-translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                        <div className="rotating-border-inner text-[#F8F6F1] p-5">
                            {barber.photo_url ? (
                                <img
                                    src={barber.photo_url}
                                    alt={barber.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-xl"
                                />
                            ) : (
                                <div className="absolute inset-0 w-full h-full bg-[#141413] flex items-center justify-center text-white/30 rounded-xl">
                                    <Scissors className="w-12 h-12" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/40 to-transparent rounded-xl" />

                            {/* Bagian bawah kartu */}
                            <div className="relative z-10 mt-auto">
                                <h3 className="font-display text-xl font-bold text-white group-hover:text-[#dd3e1f] transition-colors leading-tight mb-2">
                                    {barber.name}
                                </h3>

                                {/* Badge Specialty dengan Border Garis Berputar */}
                                <div className="rotating-badge p-[1.5px] inline-block max-w-full">
                                    <div className="rotating-badge-inner px-3 py-1 flex items-center gap-1.5 text-white text-[11px] font-semibold">
                                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#dd3e1f] opacity-90" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff6b4a]" />
                                        </span>
                                        <span className="truncate">
                                            {barber.specialty.split("&")[0].trim()}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                                    <span className="text-[11px] text-[#dd3e1f] font-semibold">
                                        Spesialis Potongan
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white group-hover:bg-[#dd3e1f] group-hover:text-white transition-colors">
                                        <span>Profil</span>
                                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                                            &gt;
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Indikator Garis Bawah */}
            <div className="flex items-center justify-center gap-2 mt-4">
                {barbers.map((b, i) => (
                    <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBarber(b)}
                        aria-label={`Lihat profil ${b.name}`}
                        className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${i === activeIndex
                            ? "w-8 bg-[#141413]"
                            : "w-4 bg-[#141413]/20 hover:bg-[#141413]/40"
                            }`}
                    />
                ))}
            </div>

            {/* MODAL PROFIL BARBER SAAT DIKLIK */}
            {selectedBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300"
                    onClick={() => setSelectedBarber(null)}
                >
                    <div
                        className="modal-spring-in relative max-w-[390px] w-full rounded-2xl bg-white p-4 shadow-2xl border border-[#141413]/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Tombol Close Pojok Kanan Atas */}
                        <button
                            type="button"
                            onClick={() => setSelectedBarber(null)}
                            aria-label="Tutup kartu profil"
                            className="absolute top-7 right-7 z-20 w-9 h-9 rounded-full bg-white text-[#141413] border-2 border-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Area Dalam */}
                        <div className="rounded-xl bg-[#EAE4DC]/65 pt-9 px-6 pb-0 flex flex-col items-center text-center overflow-hidden">
                            <h3 className="font-display text-lg sm:text-xl font-bold text-[#141413] tracking-tight">
                                {selectedBarber.name}
                            </h3>

                            {/* Badge Status + Specialty dengan Border Garis Berputar */}
                            <div className="rotating-badge p-[1.5px] inline-block mt-2 mb-5">
                                <div className="rotating-badge-inner px-3.5 py-1 flex items-center gap-1.5 text-white text-xs font-medium">
                                    <Sparkles
                                        className="w-3.5 h-3.5 text-[#dd3e1f] animate-spin shrink-0"
                                        style={{ animationDuration: "6s" }}
                                    />
                                    <span>Available • {selectedBarber.specialty}</span>
                                </div>
                            </div>

                            {/* Bio Singkat */}
                            {selectedBarber.bio && (
                                <p className="text-xs text-[#706D65] max-w-xs mb-5 leading-relaxed">
                                    {selectedBarber.bio}
                                </p>
                            )}

                            {/* Foto Potret Barber di Tengah */}
                            <div className="w-full aspect-[4/4] rounded-t-xl overflow-hidden bg-[#dd3e1f]/15 shadow-inner">
                                {selectedBarber.photo_url ? (
                                    <img
                                        src={selectedBarber.photo_url}
                                        alt={selectedBarber.name}
                                        className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] scale-100 hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-[#706D65] font-semibold">
                                        Foto Belum Diunggah
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Bawah Putih */}
                        <div className="pt-4 pb-2 px-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-[#EAE4DC] border border-[#141413]/10">
                                        {selectedBarber.photo_url ? (
                                            <img
                                                src={selectedBarber.photo_url}
                                                alt={selectedBarber.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[#141413]">
                                                {selectedBarber.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                                </div>

                                <div className="truncate">
                                    <p className="text-xs font-bold text-[#141413] truncate">
                                        @{selectedBarber.name.toLowerCase().replace(/[^a-z0-9]/g, "")}
                                    </p>
                                    <p className="text-[11px] text-[#706D65] truncate">
                                        Siap melayani hari ini
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`/booking?barberId=${selectedBarber.id}`}
                                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#dd3e1f] text-white border-2 border-[#141413] shadow-[2px_2px_0px_#141413] text-xs font-bold hover:bg-[#141413] transition-all duration-300 hover:scale-105 shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Pilih Barber</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}