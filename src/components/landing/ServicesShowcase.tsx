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
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-[#EAE4DC]">
                <p className="font-medium">Daftar layanan belum ditambahkan.</p>
                <p className="text-sm text-[#EAE4DC]/60 mt-1">
                    Admin dapat menambahkan layanan dan harga melalui Dashboard Admin.
                </p>
            </div>
        );
    }

    // Hanya tampilkan maksimal 3 layanan unggulan di halaman utama agar tidak penuh
    const featuredServices = services.slice(0, 3);

    return (
        <>
            {/* BAGIAN ATAS: Pill Tags Interaktif (Gaya Referensi Editorial) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14">
                <div className="lg:col-span-8 rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-6 shadow-xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E] block mb-2">
                        Klik Layanan Untuk Melihat Detail & Harga
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-extrabold tracking-tight mb-6">
                        Pilihan Paket Grooming sesuai Karakter Anda
                    </h3>

                    <div className="flex flex-wrap gap-3">
                        {services.map((srv, idx) => {
                            const pillStyles =
                                idx % 3 === 0
                                    ? "bg-[#141413] text-[#F8F6F1] hover:bg-[#3B281E]"
                                    : idx % 3 === 1
                                        ? "bg-[#DFC3B0] text-[#141413] hover:bg-[#d3b099]"
                                        : "bg-transparent border border-[#141413]/30 text-[#141413] hover:bg-[#EAE4DC]";

                            return (
                                <button
                                    key={srv.id}
                                    type="button"
                                    onClick={() => setSelectedService(srv)}
                                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${pillStyles}`}
                                >
                                    <span>{srv.name}</span>
                                    <span className="opacity-70 text-xs">
                                        • {formatRupiah(Number(srv.price))}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Kartu Ringkasan Kanan */}
                <div className="lg:col-span-4 rounded-2xl bg-[#22211F] text-[#F8F6F1] p-5 sm:p-6 flex flex-col justify-between border border-white/10">
                    <div>
                        <h4 className="font-display text-xl sm:text-2xl font-bold leading-snug">
                            MR A Studio — Lebih dari Sekadar Barbershop
                        </h4>
                        <p className="text-xs sm:text-sm text-[#EAE4DC]/75 mt-4 leading-relaxed">
                            Setiap paket dirancang dengan standar presisi tinggi. Klik salah
                            satu layanan atau buka katalog lengkap melalui pop-up modal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsFullCatalogOpen(true)}
                        className="mt-8 w-full py-3.5 px-5 rounded-full bg-[#DFC3B0] text-[#141413] text-xs font-bold uppercase tracking-wider hover:bg-[#F8F6F1] transition-colors flex items-center justify-center gap-2"
                    >
                        <Layers className="w-4 h-4" />
                        <span>Buka Semua Pricelist ({services.length})</span>
                    </button>
                </div>
            </div>

            {/* BAGIAN BAWAH: 3 Kartu Vertikal Editorial (Seperti Referensi) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-3 flex flex-col justify-between py-2">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-[#DFC3B0] font-semibold">
                            Layanan Unggulan
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8F6F1] mt-2 leading-tight">
                            Katalog & Pricelist
                        </h2>
                        <p className="text-sm text-[#EAE4DC]/70 mt-4 leading-relaxed">
                            Pilih paket di samping untuk melihat rincian tahapan treatment
                            serta estimasi durasi pengerjaan.
                        </p>
                    </div>

                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={() => setIsFullCatalogOpen(true)}
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#DFC3B0] hover:text-white transition-colors"
                        >
                            <span>Lihat Tabel Harga Lengkap</span>
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredServices.map((srv) => (
                        <div
                            key={srv.id}
                            onClick={() => setSelectedService(srv)}
                            className="group cursor-pointer rounded-2xl bg-gradient-to-b from-[#DFC3B0] via-[#EAE4DC] to-[#1E1D1B] p-5 sm:p-6 flex flex-col justify-between min-h-[280px] text-[#141413] relative overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 shadow-xl"
                        >
                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141413]/10 text-[#141413] text-[11px] font-bold">
                                    <Clock className="w-3 h-3" />
                                    {srv.duration_minutes} Menit
                                </span>
                                <h3 className="font-display text-lg sm:text-xl font-extrabold mt-4 leading-snug">
                                    {srv.name}
                                </h3>
                                <p className="text-xs text-[#141413]/80 mt-2.5 line-clamp-3 leading-relaxed">
                                    {srv.description ||
                                        "Konsultasi personal, precision haircut, dan styling profesional."}
                                </p>
                            </div>

                            <div className="relative z-10 mt-10 pt-4 border-t border-white/20 flex flex-col gap-3 text-[#F8F6F1]">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-[#EAE4DC]/75 block">
                                        Investasi
                                    </span>
                                    <span className="font-display text-2xl font-extrabold text-white">
                                        {formatRupiah(Number(srv.price))}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedService(srv);
                                    }}
                                    className="w-full py-2.5 px-4 rounded-full bg-[#F8F6F1] text-[#141413] text-xs font-bold uppercase tracking-wider hover:bg-[#DFC3B0] transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span>Detail & Booking</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL 1: DETAIL 1 LAYANAN SPESIFIK */}
            {selectedService && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedService(null)}
                >
                    <div
                        className="relative max-w-lg w-full rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-6 shadow-2xl border border-[#141413]/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedService(null)}
                            aria-label="Tutup modal"
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#EAE4DC] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#DFC3B0]/50 text-[#3B281E] text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Detail Layanan</span>
                        </div>

                        <h3 className="font-display text-lg sm:text-xl font-extrabold mt-4">
                            {selectedService.name}
                        </h3>

                        <div className="mt-4 p-5 rounded-xl bg-[#EAE4DC]/70 space-y-3">
                            <p className="text-sm text-[#141413] leading-relaxed">
                                {selectedService.description ||
                                    "Layanan grooming lengkap dengan konsultasi struktur wajah dan penataan rambut akhir."}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-[#141413]/10 text-xs font-semibold text-[#3B281E]">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    Estimasi Durasi: {selectedService.duration_minutes} Menit
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Termasuk Konsultasi
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-[#706D65] block">
                                    Harga Layanan
                                </span>
                                <span className="font-display text-3xl font-extrabold text-[#141413]">
                                    {formatRupiah(Number(selectedService.price))}
                                </span>
                            </div>

                            <Link
                                href={`/booking?serviceId=${selectedService.id}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shadow-lg"
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
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsFullCatalogOpen(false)}
                >
                    <div
                        className="relative max-w-2xl w-full max-h-[85vh] flex flex-col rounded-2xl bg-[#F8F6F1] text-[#141413] p-5 sm:p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-5 border-b border-[#141413]/10">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                                    Katalog Lengkap
                                </span>
                                <h3 className="font-display text-lg sm:text-xl font-extrabold">
                                    Layanan & Pricelist MR A Studio
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFullCatalogOpen(false)}
                                className="w-10 h-10 rounded-full bg-[#EAE4DC] text-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto py-5 space-y-3 pr-1">
                            {services.map((srv) => (
                                <div
                                    key={srv.id}
                                    className="p-5 rounded-xl bg-[#EAE4DC]/60 hover:bg-[#EAE4DC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#141413]/10"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2.5">
                                            <h4 className="font-display text-lg font-bold">
                                                {srv.name}
                                            </h4>
                                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#DFC3B0]/60 text-[#3B281E]">
                                                {srv.duration_minutes} menit
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#706D65] leading-relaxed">
                                            {srv.description}
                                        </p>
                                    </div>

                                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                        <span className="font-display text-lg font-extrabold text-[#141413]">
                                            {formatRupiah(Number(srv.price))}
                                        </span>
                                        <Link
                                            href={`/booking?serviceId=${srv.id}`}
                                            className="px-4 py-2 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-semibold hover:bg-[#3B281E] transition-colors"
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
        </>
    );
}