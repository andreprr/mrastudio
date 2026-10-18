"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BarberItem } from "@/types/database";
import {
    ArrowUpRight,
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
            {/* Header ala "Live Rooms (5)" di Referensi Gambar 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#DFC3B0] ring-4 ring-[#DFC3B0]/30 animate-pulse" />
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

                {/* Filter / Navigasi Kanan Atas ala Referensi */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <div className="hidden sm:flex items-center -space-x-2 mr-2">
                        {barbers.slice(0, 4).map((b) => (
                            <div
                                key={b.id}
                                className="w-9 h-9 rounded-full border-2 border-[#F8F6F1] overflow-hidden bg-[#141413]"
                            >
                                {b.photo_url ? (
                                    <img
                                        src={b.photo_url}
                                        alt={b.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white font-bold">
                                        {b.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <span className="px-4 py-2 rounded-full bg-white border border-[#141413]/10 text-xs font-semibold text-[#141413] shadow-sm">
                        MR A Stylists
                    </span>

                    <button
                        type="button"
                        onClick={() => scrollByCard("left")}
                        aria-label="Geser ke kiri"
                        className="w-10 h-10 rounded-full bg-white border border-[#141413]/10 text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollByCard("right")}
                        aria-label="Geser ke kanan"
                        className="w-10 h-10 rounded-full bg-white border border-[#141413]/10 text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Horizontal Carousel Komunitas Kreatif */}
            <div
                ref={scrollContainerRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: "none" }}
            >
                {barbers.map((barber) => (
                    <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className="snap-center shrink-0 w-[260px] sm:w-[280px] h-[340px] rounded-xl overflow-hidden relative cursor-pointer group bg-[#141413] text-[#F8F6F1] p-5 flex flex-col justify-between border border-white/10 shadow-md transition-transform duration-300 hover:-translate-y-1"
                    >
                        {barber.photo_url ? (
                            <img
                                src={barber.photo_url}
                                alt={barber.name}
                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="absolute inset-0 w-full h-full bg-[#141413] flex items-center justify-center text-white/30">
                                <Scissors className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/40 to-transparent" />

                        {/* Bagian atas kartu: badge status kecil ACTIVE dengan titik hijau dan spesialisasi */}
                        <div className="relative z-10 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                ACTIVE
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 truncate max-w-[130px]">
                                {barber.specialty.split("&")[0].trim()}
                            </span>
                        </div>

                        {/* Bagian bawah kartu: teks MR A STUDIO, Nama Barber, spesialisasi, dan tombol/label Profil > */}
                        <div className="relative z-10 mt-auto">
                            <span className="text-[10px] text-[#DFC3B0] font-bold uppercase tracking-widest block mb-1">
                                MR A STUDIO
                            </span>
                            <h3 className="font-display text-xl font-bold text-white group-hover:text-[#DFC3B0] transition-colors leading-tight">
                                {barber.name}
                            </h3>
                            <p className="text-xs text-[#EAE4DC]/80 font-medium truncate mt-1">
                                {barber.specialty}
                            </p>
                            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[11px] text-[#DFC3B0] font-semibold">
                                    Spesialis Potongan
                                </span>
                                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white group-hover:bg-[#DFC3B0] group-hover:text-[#141413] transition-colors">
                                    Profil &gt;
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Indikator Garis Bawah ala Gambar 1 */}
            <div className="flex items-center justify-center gap-2 mt-4">
                {barbers.map((b, i) => (
                    <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBarber(b)}
                        aria-label={`Lihat profil ${b.name}`}
                        className={`h-1.5 rounded-full transition-all ${i === activeIndex
                                ? "w-8 bg-[#141413]"
                                : "w-4 bg-[#141413]/20 hover:bg-[#141413]/40"
                            }`}
                    />
                ))}
            </div>

            {/* MODAL PROFIL BARBER SAAT DIKLIK (Persis Referensi Gambar 2 "Sienna Brooks") */}
            {selectedBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedBarber(null)}
                >
                    <div
                        className="relative max-w-[390px] w-full rounded-2xl bg-white p-4 shadow-2xl border border-[#141413]/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Tombol Close Pojok Kanan Atas */}
                        <button
                            type="button"
                            onClick={() => setSelectedBarber(null)}
                            aria-label="Tutup kartu profil"
                            className="absolute top-7 right-7 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Area Dalam Abu-abu/Krem Muda Membulat dengan Nama di Atas & Foto di Bawah (Seperti Gambar 2) */}
                        <div className="rounded-xl bg-[#EAE4DC]/65 pt-9 px-6 pb-0 flex flex-col items-center text-center overflow-hidden">
                            <h3 className="font-display text-lg sm:text-xl font-bold text-[#141413] tracking-tight">
                                {selectedBarber.name}
                            </h3>

                            {/* Status "Connecting / Available" di bawah nama */}
                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#706D65] mt-1.5 mb-5">
                                <Sparkles className="w-3.5 h-3.5 text-[#3B281E] animate-spin" style={{ animationDuration: "6s" }} />
                                <span>Available • {selectedBarber.specialty}</span>
                            </div>

                            {/* Bio Singkat */}
                            {selectedBarber.bio && (
                                <p className="text-xs text-[#706D65] max-w-xs mb-5 leading-relaxed">
                                    {selectedBarber.bio}
                                </p>
                            )}

                            {/* Foto Potret Barber di Tengah */}
                            <div className="w-full aspect-[4/4] rounded-t-xl overflow-hidden bg-[#DFC3B0]/40 shadow-inner">
                                {selectedBarber.photo_url ? (
                                    <img
                                        src={selectedBarber.photo_url}
                                        alt={selectedBarber.name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-[#706D65] font-semibold">
                                        Foto Belum Diunggah
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Bawah Putih: Avatar Kecil + Handle Kiri & Tombol Hitam "+ Pilih Barber" Kanan */}
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
                                    {/* Titik Hijau Online seperti di Gambar 2 */}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
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
                                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg bg-[#141413] text-white text-xs font-semibold hover:bg-[#3B281E] transition-colors shrink-0 shadow-md"
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