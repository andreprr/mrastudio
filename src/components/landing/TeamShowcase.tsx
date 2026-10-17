"use client";

import { useState, useRef } from "react";
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    if (!barbers || barbers.length === 0) {
        return (
            <div className="rounded-[2.5rem] border border-[#141413]/10 bg-[#EAE4DC]/40 p-12 text-center">
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
        const amount = 360;
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
                    <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#141413] tracking-tight">
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

            {/* Horizontal Carousel Komunitas Kreatif (Gambar 1) */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: "none" }}
            >
                {barbers.map((barber, idx) => {
                    const variant = idx % 3;

                    // VARIANT 1 (Tengah / Spotlight Portrait seperti "Sarah creative corner" di Gambar 1)
                    if (variant === 1) {
                        return (
                            <div
                                key={barber.id}
                                onClick={() => setSelectedBarber(barber)}
                                className="snap-center shrink-0 w-[300px] sm:w-[340px] cursor-pointer group flex flex-col"
                            >
                                <div className="relative h-[370px] w-full rounded-[2.2rem] overflow-hidden bg-[#EAE4DC] shadow-md">
                                    {barber.photo_url ? (
                                        <img
                                            src={barber.photo_url}
                                            alt={barber.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#706D65]">
                                            <Scissors className="w-10 h-10 opacity-30" />
                                        </div>
                                    )}

                                    {/* Top Badges ala "LIVE" & "3.8m Followers" */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/35 backdrop-blur-md text-white text-[11px] font-semibold">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            ACTIVE
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-md text-white text-[11px] font-semibold">
                                            {barber.specialty.split("&")[0]}
                                        </span>
                                    </div>
                                </div>

                                {/* Label Bawah Kartu seperti "Sarah creative corner ↗" */}
                                <div className="pt-4 px-2 flex items-start justify-between">
                                    <div>
                                        <h3 className="font-display text-xl font-extrabold text-[#141413] group-hover:text-[#3B281E] transition-colors">
                                            {barber.name}
                                        </h3>
                                        <p className="text-sm text-[#706D65] font-medium">
                                            {barber.specialty}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#141413] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // VARIANT 0 (Kartu Solid Pastel/Beige/Peach dengan Avatar & Pill Button seperti Kartu Kiri Gambar 1)
                    if (variant === 0) {
                        const bgClass =
                            barber.card_theme === "peach"
                                ? "bg-[#DFC3B0] text-[#141413]"
                                : barber.card_theme === "charcoal"
                                    ? "bg-[#141413] text-[#F8F6F1]"
                                    : "bg-[#EAE4DC] text-[#141413]";

                        return (
                            <div
                                key={barber.id}
                                onClick={() => setSelectedBarber(barber)}
                                className={`snap-center shrink-0 w-[300px] sm:w-[340px] h-[430px] rounded-[2.2rem] p-7 flex flex-col justify-between cursor-pointer transition-transform duration-300 hover:-translate-y-1.5 shadow-md ${bgClass}`}
                            >
                                {/* Top Header */}
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                                        <Scissors className="w-4 h-4" />
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest">
                                        MR A STUDIO
                                    </span>
                                </div>

                                {/* Tengah: Avatar Preview & Headline */}
                                <div className="my-auto pt-6">
                                    <div className="flex items-center -space-x-2 mb-4">
                                        <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-black/20 shadow">
                                            {barber.photo_url ? (
                                                <img
                                                    src={barber.photo_url}
                                                    alt={barber.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold">
                                                    {barber.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-[#3B281E] text-[#F8F6F1] flex items-center justify-center text-[10px] font-bold">
                                            PRO
                                        </div>
                                    </div>

                                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-70 block">
                                        ✦ {barber.specialty}
                                    </span>
                                    <h3 className="font-display text-2xl sm:text-3xl font-extrabold mt-1.5 leading-tight">
                                        {barber.name}
                                    </h3>
                                    <p className="text-xs opacity-80 mt-2 line-clamp-2 leading-relaxed">
                                        {barber.bio ||
                                            "Klik untuk melihat profil lengkap dan jadwal ketersediaan barber."}
                                    </p>
                                </div>

                                {/* Bottom Pills: "Specialty" & "Lihat >" */}
                                <div className="flex items-center justify-between gap-2 pt-4">
                                    <span className="px-3.5 py-1.5 rounded-full bg-black/10 text-xs font-semibold truncate">
                                        {barber.specialty}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-sm text-xs font-bold shrink-0">
                                        Profil &gt;
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    // VARIANT 2 (Kartu Full Image dengan Overlay Teks Bawah seperti Kartu Kanan Gambar 1)
                    return (
                        <div
                            key={barber.id}
                            onClick={() => setSelectedBarber(barber)}
                            className="snap-center shrink-0 w-[300px] sm:w-[340px] h-[430px] rounded-[2.2rem] overflow-hidden relative cursor-pointer group bg-[#141413] text-white p-7 flex flex-col justify-between shadow-md transition-transform duration-300 hover:-translate-y-1.5"
                        >
                            {barber.photo_url && (
                                <img
                                    src={barber.photo_url}
                                    alt={barber.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/90 via-[#141413]/25 to-transparent" />

                            <div className="relative z-10 flex items-center justify-between">
                                <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <span className="px-3.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-[11px] font-semibold">
                                    Senior Barber
                                </span>
                            </div>

                            <div className="relative z-10 mt-auto">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#DFC3B0] block">
                                    MR A STUDIO
                                </span>
                                <h3 className="font-display text-2xl sm:text-3xl font-extrabold mt-1 leading-tight">
                                    {barber.name}
                                </h3>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs text-[#EAE4DC]/85 font-medium truncate pr-2">
                                        {barber.specialty}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-xs font-bold shrink-0">
                                        Pilih &gt;
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                        className="relative max-w-[390px] w-full rounded-[2.6rem] bg-white p-4 shadow-2xl border border-[#141413]/5"
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
                        <div className="rounded-[2rem] bg-[#EAE4DC]/65 pt-9 px-6 pb-0 flex flex-col items-center text-center overflow-hidden">
                            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
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
                            <div className="w-full aspect-[4/4] rounded-t-[1.75rem] overflow-hidden bg-[#DFC3B0]/40 shadow-inner">
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
                                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[#141413] text-white text-xs font-semibold hover:bg-[#3B281E] transition-colors shrink-0 shadow-md"
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