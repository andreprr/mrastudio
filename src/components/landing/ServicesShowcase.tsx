"use client";

import { useState } from "react";
import Link from "next/link";
import { ServiceItem } from "@/types/database";
import { formatRupiah } from "@/config/site";
import {
    Clock,
    ArrowUpRight,
    X,
    Sparkles,
    Layers,
    CheckCircle2,
} from "lucide-react";

export function ServicesShowcase({ services }: { services: ServiceItem[] }) {
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(
        null
    );
    const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);

    if (!services || services.length === 0) {
        return (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-[#EAE4DC]">
                <p className="font-medium">Daftar layanan belum ditambahkan.</p>
                <p className="text-sm text-[#EAE4DC]/60 mt-1">
                    Admin dapat menambahkan layanan dan harga melalui Dashboard Admin.
                </p>
            </div>
        );
    }

    // Menampilkan 3 layanan utama sebagai kartu besar
    const featuredServices = services.slice(0, 3);

    return (
        <div className="space-y-8 sm:space-y-10">
            {/* 1. HEADER SECTION: Bersih & Sejajar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6 sm:pb-8">
                <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DFC3B0]/15 border border-[#DFC3B0]/30 text-[#DFC3B0] text-[11px] font-mono uppercase tracking-widest mb-3">
                        <Sparkles className="w-3 h-3" />
                        <span>Layanan & Pricelist</span>
                    </div>
                    <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#F8F6F1] tracking-tight leading-tight">
                        Pilihan Paket Grooming Sesuai Karakter Anda
                    </h2>
                    <p className="text-xs sm:text-sm text-[#EAE4DC]/70 mt-2.5 leading-relaxed">
                        Setiap paket dirancang dengan standar presisi tinggi. Pilih layanan
                        di bawah untuk melihat rincian tahapan treatment dan estimasi waktu.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsFullCatalogOpen(true)}
                    className="self-start md:self-auto shrink-0 px-5 py-3 rounded-xl bg-[#22211F] hover:bg-[#DFC3B0] text-[#F8F6F1] hover:text-[#141413] border border-white/15 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-sm cursor-pointer"
                >
                    <Layers className="w-4 h-4" />
                    <span>Semua Pricelist ({services.length})</span>
                </button>
            </div>

            {/* 2. FEATURED CARDS: 3 Kartu Utama dengan Hirarki Visual Jelas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {featuredServices.map((srv, idx) => {
                    // Kartu pertama dibuat menonjol (Highlight)
                    const isPrimary = idx === 0;
                    const indexNumber = String(idx + 1).padStart(2, "0");

                    return (
                        <div
                            key={srv.id}
                            onClick={() => setSelectedService(srv)}
                            className={`group cursor-pointer rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 border ${isPrimary
                                    ? "bg-[#F8F6F1] text-[#141413] border-[#F8F6F1] shadow-xl"
                                    : "bg-[#1C1B19] text-[#F8F6F1] border-white/10 hover:border-[#DFC3B0]/40"
                                }`}
                        >
                            {/* Bagian Atas Kartu */}
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-6">
                                    <span
                                        className={`text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-md font-semibold ${isPrimary
                                                ? "bg-[#141413] text-[#F8F6F1]"
                                                : "bg-white/10 text-[#DFC3B0]"
                                            }`}
                                    >
                                        {isPrimary ? "Populer" : `Paket ${indexNumber}`}
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${isPrimary
                                                ? "text-[#706D65]"
                                                : "text-[#EAE4DC]/60"
                                            }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        {srv.duration_minutes} Menit
                                    </span>
                                </div>

                                <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                                    {srv.name}
                                </h3>

                                <p
                                    className={`text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed ${isPrimary
                                            ? "text-[#141413]/75"
                                            : "text-[#EAE4DC]/65"
                                        }`}
                                >
                                    {srv.description ||
                                        "Konsultasi personal struktur wajah, precision haircut, keramas menyegarkan, dan styling pomade/powder."}
                                </p>
                            </div>

                            {/* Bagian Bawah Kartu (Harga & CTA) */}
                            <div
                                className={`mt-8 pt-5 border-t flex items-end justify-between gap-4 ${isPrimary
                                        ? "border-[#141413]/10"
                                        : "border-white/10"
                                    }`}
                            >
                                <div>
                                    <span
                                        className={`text-[10px] font-mono uppercase tracking-widest block mb-0.5 ${isPrimary
                                                ? "text-[#706D65]"
                                                : "text-[#EAE4DC]/50"
                                            }`}
                                    >
                                        Investasi
                                    </span>
                                    <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                                        {formatRupiah(Number(srv.price))}
                                    </span>
                                </div>

                                <span
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0 ${isPrimary
                                            ? "bg-[#141413] text-[#F8F6F1] group-hover:bg-[#3B281E]"
                                            : "bg-[#DFC3B0] text-[#141413] group-hover:bg-[#F8F6F1]"
                                        }`}
                                >
                                    <ArrowUpRight className="w-5 h-5" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. QUICK EXPLORE BAR: Baris Layanan Tambahan yang Rapi */}
            <div className="rounded-2xl bg-[#1C1B19] border border-white/10 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="shrink-0">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#DFC3B0] block">
                        Eksplorasi Cepat
                    </span>
                    <p className="text-sm font-bold text-[#F8F6F1] mt-0.5">
                        Pilih layanan untuk melihat detail:
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {services.map((srv) => (
                        <button
                            key={srv.id}
                            type="button"
                            onClick={() => setSelectedService(srv)}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#DFC3B0] text-[#EAE4DC] hover:text-[#141413] border border-white/10 hover:border-transparent text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span>{srv.name}</span>
                            <span className="opacity-60 font-mono text-[11px]">
                                • {formatRupiah(Number(srv.price))}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* MODAL 1: DETAIL 1 LAYANAN SPESIFIK */}
            {selectedService && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedService(null)}
                >
                    <div
                        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-7 shadow-2xl border-t sm:border border-[#141413]/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Drag Indicator */}
                        <div className="w-10 h-1 rounded-full bg-[#141413]/20 mx-auto mb-4 sm:hidden" />

                        <button
                            type="button"
                            onClick={() => setSelectedService(null)}
                            aria-label="Tutup modal"
                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#EAE4DC] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFC3B0]/50 text-[#3B281E] text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            <span>Detail Layanan</span>
                        </div>

                        <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-3 pr-8">
                            {selectedService.name}
                        </h3>

                        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/5 space-y-3">
                            <p className="text-xs sm:text-sm text-[#141413]/90 leading-relaxed">
                                {selectedService.description ||
                                    "Layanan grooming lengkap dengan konsultasi struktur wajah dan penataan rambut akhir."}
                            </p>
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#141413]/10 text-xs font-semibold text-[#3B281E]">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Durasi: {selectedService.duration_minutes} Menit
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Termasuk Konsultasi
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D65] block">
                                    Harga Layanan
                                </span>
                                <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413]">
                                    {formatRupiah(Number(selectedService.price))}
                                </span>
                            </div>

                            <Link
                                href={`/booking?serviceId=${selectedService.id}`}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shadow-md"
                            >
                                <span>Pilih & Booking</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: DAFTAR LENGKAP SEMUA LAYANAN & PRICELIST */}
            {isFullCatalogOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setIsFullCatalogOpen(false)}
                >
                    <div
                        className="relative w-full sm:max-w-2xl max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-7 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Drag Indicator */}
                        <div className="w-10 h-1 rounded-full bg-[#141413]/20 mx-auto mb-3 sm:hidden" />

                        <div className="flex items-center justify-between pb-4 border-b border-[#141413]/10">
                            <div>
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#3B281E]">
                                    Katalog Lengkap
                                </span>
                                <h3 className="font-display text-lg sm:text-2xl font-extrabold mt-0.5">
                                    Layanan & Pricelist MR A Studio
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullCatalogOpen(false)}
                                className="w-9 h-9 rounded-full bg-[#EAE4DC] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-4 space-y-3 pr-1">
                            {services.map((srv) => (
                                <div
                                    key={srv.id}
                                    className="p-4 sm:p-5 rounded-xl bg-[#EAE4DC]/50 hover:bg-[#EAE4DC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#141413]/10"
                                >
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-display text-base sm:text-lg font-bold">
                                                {srv.name}
                                            </h4>
                                            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-[#DFC3B0]/60 text-[#3B281E]">
                                                {srv.duration_minutes} menit
                                            </span>
                                        </div>
                                        {srv.description && (
                                            <p className="text-xs text-[#706D65] leading-relaxed">
                                                {srv.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#141413]/10">
                                        <span className="font-display text-lg font-extrabold text-[#141413]">
                                            {formatRupiah(Number(srv.price))}
                                        </span>
                                        <Link
                                            href={`/booking?serviceId=${srv.id}`}
                                            className="px-4 py-2 rounded-lg bg-[#141413] text-[#F8F6F1] text-xs font-semibold hover:bg-[#3B281E] transition-colors"
                                        >
                                            Pilih Layanan
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}