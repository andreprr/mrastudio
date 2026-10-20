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

const EXPLORE_CATEGORIES = ["Semua", "Braids", "Chemical", "Haircolor", "Treatment"] as const;

// Helper untuk memisahkan tag [Kategori] dari deskripsi asli
function parseServiceMeta(srv: ServiceItem) {
    const rawDesc = srv.description || "";
    const match = rawDesc.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
    const explicitCat = (srv as ServiceItem & { category?: string }).category;

    if (explicitCat) {
        return { category: explicitCat, cleanDescription: rawDesc };
    }
    if (match) {
        return { category: match[1].trim(), cleanDescription: match[2].trim() };
    }
    return { category: "Treatment", cleanDescription: rawDesc };
}

export function ServicesShowcase({ services }: { services: ServiceItem[] }) {
    const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
    const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("Semua");

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

    // 6 layanan pertama tampil di kotak atas (diperkecil & compact)
    const featuredServices = services.slice(0, 6);
    // Layanan ke-7 dst masuk ke kontainer Eksplorasi Cepat
    const extraServices = services.slice(6);

    const filteredExtraServices = extraServices.filter((srv) => {
        if (activeCategory === "Semua") return true;
        const { category } = parseServiceMeta(srv);
        return category.toLowerCase() === activeCategory.toLowerCase();
    });

    const selectedMeta = selectedService ? parseServiceMeta(selectedService) : null;

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* 1. HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
                <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dd3e1f]/15 border border-[#dd3e1f]/40 text-[#dd3e1f] text-[11px] font-mono uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" />
                        <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#F8F6F1] tracking-tight leading-tight">
                            Layanan & Pricelist
                        </h2>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsFullCatalogOpen(true)}
                    className="self-start md:self-auto shrink-0 px-4 py-2.5 rounded-xl bg-[#141413] hover:bg-[#dd3e1f] text-white border-2 border-[#141413] hover:border-[#dd3e1f] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Semua Pricelist ({services.length})</span>
                </button>
            </div>

            {/* 2. FEATURED CARDS: 6 Kotak Pertama (Simetris 2 kolom di HP, 3 di Tablet, 6 di Desktop) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
                {featuredServices.map((srv, idx) => {
                    const isPrimary = idx === 0;
                    const indexNumber = String(idx + 1).padStart(2, "0");
                    const { cleanDescription } = parseServiceMeta(srv);

                    return (
                        <div
                            key={srv.id}
                            onClick={() => setSelectedService(srv)}
                            className={`group cursor-pointer rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 border ${isPrimary
                                    ? "bg-[#F8F6F1] text-[#141413] border-[#F8F6F1] shadow-lg"
                                    : "bg-[#1C1B19] text-[#F8F6F1] border-white/10 hover:border-[#dd3e1f]/50"
                                }`}
                        >
                            {/* Bagian Atas Kartu Compact */}
                            <div>
                                <div className="flex items-center justify-between gap-1 mb-2.5">
                                    <span
                                        className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${isPrimary
                                                ? "bg-[#141413] text-[#F8F6F1]"
                                                : "bg-[#dd3e1f]/20 text-[#dd3e1f]"
                                            }`}
                                    >
                                        {isPrimary ? "Populer" : `Paket ${indexNumber}`}
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-medium ${isPrimary ? "text-[#706D65]" : "text-[#EAE4DC]/60"
                                            }`}
                                    >
                                        <Clock className="w-2.5 h-2.5" />
                                        {srv.duration_minutes}m
                                    </span>
                                </div>

                                <h3 className="font-display text-sm sm:text-[15px] font-extrabold tracking-tight leading-snug line-clamp-1">
                                    {srv.name}
                                </h3>

                                <p
                                    className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${isPrimary ? "text-[#141413]/75" : "text-[#EAE4DC]/65"
                                        }`}
                                >
                                    {cleanDescription ||
                                        "Haircut, shaving, hairwash, scrub & styling."}
                                </p>
                            </div>

                            {/* Bagian Bawah Kartu Compact */}
                            <div
                                className={`mt-4 pt-2.5 border-t flex items-end justify-between gap-1.5 ${isPrimary ? "border-[#141413]/10" : "border-white/10"
                                    }`}
                            >
                                <div className="min-w-0">
                                    <span
                                        className={`text-[9px] font-mono uppercase tracking-widest block ${isPrimary ? "text-[#706D65]" : "text-[#EAE4DC]/50"
                                            }`}
                                    >
                                        Harga
                                    </span>
                                    <span className="font-display text-sm sm:text-base font-extrabold tracking-tight truncate block">
                                        {formatRupiah(Number(srv.price))}
                                    </span>
                                </div>

                                <span
                                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0 ${isPrimary
                                            ? "bg-[#141413] text-[#F8F6F1] group-hover:bg-[#dd3e1f]"
                                            : "bg-[#dd3e1f] text-white group-hover:bg-white group-hover:text-[#141413]"
                                        }`}
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. KONTAINER EKSPLORASI CEPAT (Muncul jika layanan > 6) */}
            {extraServices.length > 0 && (
                <div className="rounded-2xl bg-[#1C1B19] border border-white/10 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div>
                            <span className="text-[11px] font-mono uppercase tracking-widest text-[#dd3e1f] block">
                                Eksplorasi Cepat
                            </span>
                            <p className="text-sm font-bold text-[#F8F6F1] mt-0.5">
                                Pilih layanan untuk melihat kategori detail:
                            </p>
                        </div>

                        {/* Tab Kategori: Semua, Braids, Chemical, Haircolor, Treatment */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
                            {EXPLORE_CATEGORIES.map((cat) => {
                                const isActive = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${isActive
                                                ? "bg-[#dd3e1f] text-white shadow-sm"
                                                : "bg-white/5 text-[#EAE4DC]/70 hover:bg-white/10 hover:text-white"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Daftar Item Layanan ke-7 dst */}
                    {filteredExtraServices.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#EAE4DC]/50">
                            Belum ada layanan pada kategori {activeCategory}.
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            {filteredExtraServices.map((srv) => {
                                const { category } = parseServiceMeta(srv);
                                return (
                                    <button
                                        key={srv.id}
                                        type="button"
                                        onClick={() => setSelectedService(srv)}
                                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#dd3e1f] text-[#EAE4DC] hover:text-white border border-white/10 hover:border-[#dd3e1f] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 group"
                                    >
                                        {activeCategory === "Semua" && (
                                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 group-hover:bg-black/20 text-[#dd3e1f] group-hover:text-white">
                                                {category}
                                            </span>
                                        )}
                                        <span>{srv.name}</span>
                                        <span className="opacity-60 font-mono text-[11px]">
                                            • {formatRupiah(Number(srv.price))}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: DETAIL 1 LAYANAN SPESIFIK */}
            {selectedService && selectedMeta && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedService(null)}
                >
                    <div
                        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-7 shadow-2xl border-t sm:border border-[#141413]/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 rounded-full bg-[#141413]/20 mx-auto mb-4 sm:hidden" />

                        <button
                            type="button"
                            onClick={() => setSelectedService(null)}
                            aria-label="Tutup modal"
                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#EAE4DC] text-[#141413] border-2 border-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dd3e1f]/15 text-[#dd3e1f] border border-[#dd3e1f]/40 text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            <span>{selectedMeta.category}</span>
                        </div>

                        <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-3 pr-8">
                            {selectedService.name}
                        </h3>

                        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/5 space-y-3">
                            <p className="text-xs sm:text-sm text-[#141413]/90 leading-relaxed">
                                {selectedMeta.cleanDescription ||
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
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#dd3e1f] text-white border-2 border-[#141413] shadow-[2px_2px_0px_#141413] text-xs font-bold uppercase tracking-wider hover:bg-[#141413] transition-colors"
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
                        <div className="w-10 h-1 rounded-full bg-[#141413]/20 mx-auto mb-3 sm:hidden" />

                        <div className="flex items-center justify-between pb-4 border-b border-[#141413]/10">
                            <div>
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#dd3e1f]">
                                    Katalog Lengkap
                                </span>
                                <h3 className="font-display text-lg sm:text-2xl font-extrabold mt-0.5">
                                    Layanan & Pricelist MR A Studio
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullCatalogOpen(false)}
                                className="w-9 h-9 rounded-full bg-[#EAE4DC] text-[#141413] border-2 border-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-4 space-y-3 pr-1">
                            {services.map((srv) => {
                                const { category, cleanDescription } = parseServiceMeta(srv);
                                return (
                                    <div
                                        key={srv.id}
                                        className="p-4 sm:p-5 rounded-xl bg-[#EAE4DC]/50 hover:bg-[#EAE4DC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#141413]/10"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#141413] text-[#F8F6F1]">
                                                    {category}
                                                </span>
                                                <h4 className="font-display text-base sm:text-lg font-bold">
                                                    {srv.name}
                                                </h4>
                                                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-[#dd3e1f]/15 text-[#dd3e1f] border border-[#dd3e1f]/30">
                                                    {srv.duration_minutes} menit
                                                </span>
                                            </div>
                                            {cleanDescription && (
                                                <p className="text-xs text-[#706D65] leading-relaxed">
                                                    {cleanDescription}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#141413]/10">
                                            <span className="font-display text-lg font-extrabold text-[#141413]">
                                                {formatRupiah(Number(srv.price))}
                                            </span>
                                            <Link
                                                href={`/booking?serviceId=${srv.id}`}
                                                className="px-4 py-2 rounded-lg bg-[#141413] text-white border-2 border-[#141413] hover:border-[#dd3e1f] hover:bg-[#dd3e1f] text-xs font-bold transition-colors"
                                            >
                                                Pilih Layanan
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}