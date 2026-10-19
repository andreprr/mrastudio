import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_SITE_SETTINGS } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { GallerySection } from "@/components/landing/GallerySection";
import { ServicesShowcase } from "@/components/landing/ServicesShowcase";
import { TeamShowcase } from "@/components/landing/TeamShowcase";
import {
    ArrowUpRight,
    Star,
    MapPin,
    Sparkles,
    CheckCircle2,
} from "lucide-react";

export default async function LandingPage() {
    const supabase = await createServerSupabase();

    const [
        { data: settingRow },
        { data: services },
        { data: barbers },
        { data: gallery },
        { data: reviews },
        { data: businessHours },
    ] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "general").single(),
        supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("barbers")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: true }),
        supabase
            .from("gallery_items")
            .select("*")
            .eq("is_published", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("reviews")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(6),
        supabase
            .from("business_hours")
            .select("*")
            .order("day_of_week", { ascending: true }),
    ]);

    const settings = {
        ...DEFAULT_SITE_SETTINGS,
        ...(settingRow?.value || {}),
    };

    const DAY_NAMES = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#F8F6F1] text-[#141413]">
            <Navbar brandName={settings.brand_name} />

            {/* HERO SECTION — FULL GAMBAR DENGAN TEKS DI ATAS GAMBAR (Gaya Paréa) */}
            <section className="relative min-h-[92vh] w-full flex flex-col justify-between overflow-hidden bg-[#141413]">
                {/* Background Full Image */}
                <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=85"
                    alt="Suasana Editorial MR A Studio"
                    className="absolute inset-0 w-full h-full object-cover object-center scale-105"
                />

                {/* Overlay Gradasi Atas (Terang/Hangat untuk Navbar) & Bawah (Gelap Pekat untuk Headline) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#F8F6F1]/85 via-[#141413]/45 to-[#141413] pointer-events-none" />

                {/* Konten Tengah di Atas Gambar */}
                <div className="relative z-10 pt-36 sm:pt-44 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#141413]/80 text-[#DFC3B0] backdrop-blur-md text-xs font-semibold uppercase tracking-widest mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Premium Grooming Experience</span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md leading-[0.98]">
                        {settings.brand_name}
                    </h1>

                    <p className="mt-5 text-base sm:text-xl text-[#F8F6F1]/90 max-w-xl font-medium drop-shadow">
                        {settings.hero_subheadline}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/booking"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141413] text-[#F8F6F1] border border-white/15 font-semibold text-xs sm:text-sm hover:bg-[#3B281E] transition-all shadow-2xl"
                        >
                            <span>Booking Sekarang</span>
                            <ArrowUpRight className="w-5 h-5" />
                        </Link>
                        <a
                            href="#services"
                            className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#F8F6F1]/90 backdrop-blur-md text-[#141413] font-semibold text-xs sm:text-sm hover:bg-white transition-all"
                        >
                            Lihat Katalog Layanan
                        </a>
                    </div>
                </div>

                {/* Tipografi Statement Besar di Bagian Bawah Gambar Hero */}
                <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 pt-14">
                    <p className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[#F8F6F1]">
                        <span className="text-[#DFC3B0]">{settings.hero_headline}</span>{" "}
                        Presisi dalam setiap guntingan.
                    </p>
                </div>
            </section>

            {/* SECTION LAYANAN & PRICELIST (Ringkas + Modal Pop-up) */}
            <section
                id="services"
                className="py-14 px-4 sm:px-6 lg:px-8 bg-[#141413] text-[#F8F6F1] rounded-b-2xl"
            >
                <div className="max-w-6xl mx-auto">
                    <ServicesShowcase services={services || []} />
                </div>
            </section>

            {/* SECTION TENTANG KAMI */}
            <section
                id="about"
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-6">
                        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-[#3B281E] shadow-xl">
                            <img
                                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80"
                                alt="Interior suasana MR A Studio"
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="lg:col-span-6 space-y-6">
                        <span className="text-xs uppercase tracking-widest text-[#3B281E] font-bold">
                            Tentang MR A Studio
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight text-[#141413]">
                            {settings.about_title}
                        </h2>
                        <p className="text-[#706D65] leading-relaxed text-base">
                            {settings.about_story}
                        </p>
                        <p className="text-[#706D65] leading-relaxed text-base">
                            {settings.about_philosophy}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="p-5 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/10 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#3B281E] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm">Konsultasi Personal</h4>
                                    <p className="text-xs text-[#706D65] mt-1">
                                        Analisis bentuk kepala sebelum guntingan pertama.
                                    </p>
                                </div>
                            </div>
                            <div className="p-5 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/10 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#3B281E] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm">Alat Higienis & Steril</h4>
                                    <p className="text-xs text-[#706D65] mt-1">
                                        Standar kebersihan tinggi pada setiap sesi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION OUR TEAM */}
            <section
                id="team"
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"
            >
                <TeamShowcase barbers={barbers || []} />
            </section>

            {/* SECTION GALLERY */}
            <section
                id="gallery"
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"
            >
                <div className="mb-8">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#3B281E]">
                        Portofolio & Suasana
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413] mt-2">
                        Lookbook & Studio Gallery
                    </h2>
                </div>
                <GallerySection items={gallery || []} />
            </section>

            {/* SECTION REVIEWS */}
            <section
                id="reviews"
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"
            >
                <div className="mb-10">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#3B281E]">
                        Ulasan Terverifikasi
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413] mt-2">
                        Kata Pelanggan Kami
                    </h2>
                </div>

                {!reviews || reviews.length === 0 ? (
                    <div className="rounded-xl border border-[#141413]/10 bg-[#EAE4DC]/40 p-8 text-center">
                        <p className="text-[#141413] font-medium">
                            Belum ada ulasan yang dipublikasikan.
                        </p>
                        <p className="text-sm text-[#706D65] mt-1">
                            Ulasan asli dari pelanggan yang telah disetujui moderator akan
                            ditampilkan di bagian ini.
                        </p>
                    </div>
                ) : reviews.length >= 3 ? (
                    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden py-4">
                        {/* Gradient edge masks untuk transisi halus tepi kiri & kanan */}
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#F8F6F1] to-transparent z-10" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#F8F6F1] to-transparent z-10" />

                        <div className="flex gap-5 animate-marquee animate-marquee-pause">
                            {(() => {
                                const baseList = reviews.length < 5 ? [...reviews, ...reviews] : reviews;
                                const marqueeItems = [...baseList, ...baseList];
                                return marqueeItems.map((rev, idx) => (
                                    <div
                                        key={`${rev.id}-${idx}`}
                                        className="w-[280px] sm:w-[350px] shrink-0 rounded-xl bg-[#EAE4DC]/70 p-5 sm:p-6 flex flex-col justify-between border border-[#141413]/10 hover:-translate-y-1 hover:bg-[#EAE4DC] hover:border-[#141413]/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                                    >
                                        <div>
                                            <div className="flex items-center gap-1 text-[#3B281E]">
                                                {Array.from({ length: rev.rating }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className="w-4 h-4 fill-current motion-stagger-item"
                                                        style={{ "--i": i } as React.CSSProperties}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[#141413] mt-4 text-sm sm:text-base leading-relaxed">
                                                &ldquo;{rev.comment}&rdquo;
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-[#141413]/10 flex items-center justify-between text-xs text-[#706D65]">
                                            <span className="font-semibold text-[#141413]">
                                                {rev.customer_name}
                                            </span>
                                            <span>
                                                {new Date(rev.created_at).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.map((rev, idx) => (
                            <div
                                key={rev.id}
                                style={{ "--i": idx } as React.CSSProperties}
                                className="motion-stagger-item rounded-xl bg-[#EAE4DC]/70 p-5 sm:p-6 flex flex-col justify-between border border-[#141413]/10 hover:-translate-y-1 hover:bg-[#EAE4DC] hover:border-[#141413]/25 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-[#3B281E]">
                                        {Array.from({ length: rev.rating }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-4 h-4 fill-current motion-stagger-item"
                                                style={{ "--i": i } as React.CSSProperties}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[#141413] mt-4 text-sm sm:text-base leading-relaxed">
                                        &ldquo;{rev.comment}&rdquo;
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[#141413]/10 flex items-center justify-between text-xs text-[#706D65]">
                                    <span className="font-semibold text-[#141413]">
                                        {rev.customer_name}
                                    </span>
                                    <span>
                                        {new Date(rev.created_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="mt-auto bg-[#141413] text-[#F8F6F1] pt-14 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="rounded-2xl bg-[#DFC3B0] text-[#141413] p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
                        <div>
                            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Ready for Your Next Look?
                            </h2>
                            <p className="text-[#3B281E] text-base sm:text-lg mt-2">
                                Pilih layanan dan jadwalkan kunjunganmu di MR A Studio.
                            </p>
                        </div>
                        <Link
                            href="/booking"
                            className="px-5 py-2.5 rounded-full bg-[#141413] text-[#F8F6F1] font-medium text-xs sm:text-sm hover:bg-[#3B281E] transition-colors shrink-0 shadow-md"
                        >
                            Booking Sekarang
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12 border-b border-white/10">
                        <div>
                            <h3 className="font-display text-lg sm:text-xl font-bold">
                                {settings.brand_name}
                            </h3>
                            <p className="text-sm text-[#EAE4DC]/70 mt-3 leading-relaxed">
                                {settings.hero_subheadline}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#DFC3B0]">
                                Lokasi Studio
                            </h4>
                            <p className="text-sm text-[#EAE4DC]/80 mt-3 flex items-start gap-2">
                                <MapPin className="w-4 h-4 shrink-0 mt-1 text-[#DFC3B0]" />
                                <span>{settings.address}</span>
                            </p>
                        </div>

                        <div className="lg:col-span-2">
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#DFC3B0]">
                                Jam Operasional
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs text-[#EAE4DC]/80">
                                {(businessHours || []).map((bh) => (
                                    <div
                                        key={bh.day_of_week}
                                        className="p-3 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <span className="font-semibold block text-[#F8F6F1]">
                                            {DAY_NAMES[bh.day_of_week]}
                                        </span>
                                        {bh.is_closed ? (
                                            <span className="text-red-300">Tutup</span>
                                        ) : (
                                            <span>
                                                {bh.open_time.slice(0, 5)} – {bh.close_time.slice(0, 5)} WIB
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EAE4DC]/60 gap-4">
                        <p>
                            &copy; {new Date().getFullYear()} {settings.brand_name}. Hak cipta
                            dilindungi.
                        </p>
                        <div className="flex gap-6">
                            <Link href="/cek-booking" className="hover:text-white">
                                Cek Status Booking
                            </Link>
                            <Link href="/admin/login" className="hover:text-white">
                                Portal Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}