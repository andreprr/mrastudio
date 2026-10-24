import Link from "next/link";
import { HeroSlider } from "@/components/landing/HeroSlider";
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
import { Outfit } from "next/font/google";

const unbounded = Outfit({
    subsets: ["latin"],
    weight: ["800", "900"],
});

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
        supabase
            .from("site_settings")
            .select("value")
            .eq("key", "general")
            .single(),
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
        <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#141413]">
            {/* Animasi Keyframes untuk Border Glow Hitam & Teks Berjalan ke Kanan */}
            <style>{`
        @keyframes spinBorderBlack {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes heroTextReveal {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .animate-hero-text {
          animation: heroTextReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marqueeRight 22s linear infinite;
        }
        .animate-marquee-right:hover {
          animation-play-state: paused;
        }
        .booking-glow-btn {
          position: relative;
          display: inline-flex;
          padding: 3px;
          border-radius: 9999px;
          overflow: hidden;
          box-shadow: 0 0 18px rgba(20, 20, 19, 0.8), 0 0 28px rgba(221, 62, 31, 0.45);
        }
        .booking-glow-btn::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 260%;
          height: 260%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.35) 18%,
            #141413 42%,
            #000000 58%,
            #dd3e1f 78%,
            transparent 100%
          );
          animation: spinBorderBlack 2.4s linear infinite;
        }
      `}</style>

            <Navbar brandName={settings.brand_name} />

            {/* HERO SECTION — RESPONSIF DI MOBILE, TABLET & DESKTOP */}
            <section className="relative min-h-[100svh] sm:min-h-[92vh] w-full flex flex-col justify-between overflow-hidden bg-[#141413]">
                <HeroSlider />

                {/* Overlay Gradasi Gelap agar Teks Putih & Navbar Terbaca Jelas */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-[#141413]/50 to-[#141413] pointer-events-none z-[1]" />

                {/* Konten Tengah di Atas Gambar/Video */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 pb-20 sm:pt-32 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
                    <div
                        className="animate-hero-text inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FFFFFF] backdrop-blur-md text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-4 sm:mb-6"
                        style={{ animationDelay: "100ms" }}
                    >
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#dd3e1f]" />
                        <span>Premium Grooming Experience</span>
                    </div>

                    <h1
                        className={`${unbounded.className} animate-hero-text relative text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.05] select-none max-w-3xl`}
                        style={{ animationDelay: "220ms" }}
                    >
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 blur-2xl opacity-60 bg-gradient-to-r from-[#dd3e1f] via-[#ff7b54] to-[#dd3e1f] bg-clip-text text-transparent pointer-events-none animate-pulse"
                        >
                            {settings.brand_name}
                        </span>
                        <span className="hero-brand-glow relative z-10 text-white">
                            {settings.brand_name}
                        </span>
                    </h1>

                    <p
                        className="animate-hero-text mt-3 sm:mt-5 text-sm sm:text-lg lg:text-xl text-[#FFFFFF]/90 max-w-xl font-medium drop-shadow px-2 leading-relaxed"
                        style={{ animationDelay: "340ms" }}
                    >
                        {settings.hero_subheadline}
                    </p>

                    <div
                        className="animate-hero-text mt-6 sm:mt-8 w-full max-w-xs sm:max-w-none flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4"
                        style={{ animationDelay: "460ms" }}
                    >
                        <Link
                            href="/booking"
                            className="booking-glow-btn group w-full sm:w-auto justify-center transition-transform duration-300 hover:scale-[1.03]"
                        >
                            <span className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 rounded-full bg-[#dd3e1f] text-white font-bold text-xs sm:text-sm group-hover:bg-[#141413] transition-colors">
                                <span>Booking Sekarang</span>
                                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </span>
                        </Link>

                        <a
                            href="#services"
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 sm:py-3 rounded-full bg-[#FFFFFF] text-[#141413] border-2 border-[#141413] font-bold text-xs sm:text-sm hover:bg-[#141413] hover:text-white hover:border-white transition-all shadow-sm"
                        >
                            Lihat Katalog Layanan
                        </a>
                    </div>
                </div>

                {/* Tipografi Statement Besar Bergerak Otomatis ke Kanan di Bagian Bawah Hero */}
                <div
                    className="animate-hero-text relative z-10 w-full overflow-hidden py-3.5 sm:py-5 border-t border-white/10 bg-black/30 backdrop-blur-xs"
                    style={{ animationDelay: "580ms" }}
                >
                    <div className="animate-marquee-right flex items-center gap-6 sm:gap-10">
                        {[0, 1, 2, 3].map((i) => (
                            <p
                                key={i}
                                className="font-display text-lg sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-[#FFFFFF] whitespace-nowrap flex items-center gap-4 sm:gap-6"
                            >
                                <span className="text-[#dd3e1f]">
                                    {settings.hero_headline}
                                </span>
                                <span>Presisi dalam setiap guntingan.</span>
                                <span className="text-[#dd3e1f] text-base sm:text-2xl">
                                    ✦
                                </span>
                            </p>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION LAYANAN & PRICELIST */}
            <section
                id="services"
                className="py-12 sm:py-14 px-4 sm:px-6 lg:px-8 bg-[#141413] text-[#FFFFFF]"
            >
                <div className="max-w-6xl mx-auto">
                    <ServicesShowcase services={services || []} />
                </div>
            </section>

            {/* SECTION TENTANG KAMI — RESPONSIF DI MOBILE & DESKTOP */}
            <section
                id="about"
                className="relative w-full overflow-hidden bg-[#dd3e1f] pt-10 sm:pt-14 pb-16 sm:pb-16 px-4 sm:px-6 lg:px-8"
            >
                {/* 
                  Di Mobile: Gambar ditempel di bawah (bottom-0) dengan lebar penuh (w-full h-auto object-contain) 
                  agar tulisan MISTER A STUDIO tidak terpotong ke samping.
                  Di Desktop (sm ke atas): Kembali menggunakan h-full object-cover seperti referensi.
                */}
                <img
                    src="/banner%20Tentang%20MRA.jpg"
                    alt="Banner Tentang MR A Studio"
                    loading="lazy"
                    className="absolute inset-x-0 bottom-0 w-full h-auto sm:h-full object-contain sm:object-cover object-bottom translate-y-[12%] sm:translate-y-[11%] scale-[1.03] sm:scale-[1.02] pointer-events-none select-none"
                />

                {/* Konten Teks & 2 Kartu Putih */}
                <div className="relative z-10 max-w-5xl mx-auto w-full">
                    <div className="max-w-2xl space-y-3.5 sm:space-y-4">
                        <div>
                            <span className="text-xs sm:text-sm font-medium text-[#FFFFFF]/90 block">
                                Tentang {settings.brand_name}
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-[#141413] mt-0.5">
                                {settings.about_title}
                            </h2>
                        </div>

                        <p className="text-[#FFFFFF]/95 leading-relaxed text-xs sm:text-sm">
                            {settings.about_story}
                        </p>

                        <p className="text-[#FFFFFF]/95 leading-relaxed text-xs sm:text-sm">
                            {settings.about_philosophy}
                        </p>

                        {/* 2 Kotak Putih */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 pt-2 max-w-lg">
                            <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#141413] flex items-start gap-2.5 shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-[#dd3e1f] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-xs text-[#141413]">
                                        Konsultasi Personal
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-[#706D65] mt-0.5 leading-snug">
                                        Analisis bentuk kepala sebelum guntingan pertama.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#141413] flex items-start gap-2.5 shadow-sm">
                                <CheckCircle2 className="w-4 h-4 text-[#dd3e1f] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-xs text-[#141413]">
                                        Alat Higienis & Steril
                                    </h4>
                                    <p className="text-[10px] sm:text-[11px] text-[#706D65] mt-0.5 leading-snug">
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
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full"
            >
                <TeamShowcase barbers={barbers || []} />
            </section>

            {/* SECTION GALLERY */}
            <section
                id="gallery"
                className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full"
            >
                <div className="mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#dd3e1f]">
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
                    <span className="text-xs font-bold uppercase tracking-widest text-[#dd3e1f]">
                        Ulasan Terverifikasi
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413] mt-2">
                        Kata Pelanggan Kami
                    </h2>
                </div>

                {!reviews || reviews.length === 0 ? (
                    <div className="rounded-xl border-2 border-[#141413] bg-[#FFFFFF] p-8 text-center shadow-xs">
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
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#FFFFFF] to-transparent z-10" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#FFFFFF] to-transparent z-10" />

                        <div className="flex gap-5 animate-marquee animate-marquee-pause">
                            {(() => {
                                const baseList =
                                    reviews.length < 5
                                        ? [...reviews, ...reviews]
                                        : reviews;
                                const marqueeItems = [...baseList, ...baseList];
                                return marqueeItems.map((rev, idx) => (
                                    <div
                                        key={`${rev.id}-${idx}`}
                                        className="w-[280px] sm:w-[350px] shrink-0 rounded-xl bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between border-2 border-[#141413] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                                    >
                                        <div>
                                            <div className="flex items-center gap-1 text-[#dd3e1f]">
                                                {Array.from({ length: rev.rating }).map(
                                                    (_, i) => (
                                                        <Star
                                                            key={i}
                                                            className="w-4 h-4 fill-current motion-stagger-item"
                                                            style={
                                                                { "--i": i } as React.CSSProperties
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                            <p className="text-[#141413] mt-4 text-sm sm:text-base leading-relaxed">
                                                &ldquo;{rev.comment}&rdquo;
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-[#141413]/15 flex items-center justify-between text-xs text-[#706D65]">
                                            <span className="font-semibold text-[#141413]">
                                                {rev.customer_name}
                                            </span>
                                            <span>
                                                {new Date(
                                                    rev.created_at
                                                ).toLocaleDateString("id-ID", {
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
                                className="motion-stagger-item rounded-xl bg-[#FFFFFF] p-5 sm:p-6 flex flex-col justify-between border-2 border-[#141413] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-[#dd3e1f]">
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
                                <div className="mt-6 pt-4 border-t border-[#141413]/15 flex items-center justify-between text-xs text-[#706D65]">
                                    <span className="font-semibold text-[#141413]">
                                        {rev.customer_name}
                                    </span>
                                    <span>
                                        {new Date(rev.created_at).toLocaleDateString(
                                            "id-ID",
                                            {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            }
                                        )}
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
                    <div className="rounded-2xl bg-[#dd3e1f] text-white p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl border-2 border-[#141413]">
                        <div>
                            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                                Ready for Your Next Look?
                            </h2>
                            <p className="text-white/90 text-base sm:text-lg mt-2">
                                Pilih layanan dan jadwalkan kunjunganmu di MR A Studio.
                            </p>
                        </div>
                        <Link
                            href="/booking"
                            className="booking-glow-btn group shrink-0 transition-transform duration-300 hover:scale-[1.03]"
                        >
                            <span className="relative z-10 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#141413] text-[#FFFFFF] font-bold text-xs sm:text-sm group-hover:bg-[#242422] transition-colors">
                                <span>Booking Sekarang</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </span>
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
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#dd3e1f]">
                                Lokasi Studio
                            </h4>
                            <p className="text-sm text-[#EAE4DC]/80 mt-3 flex items-start gap-2">
                                <MapPin className="w-4 h-4 shrink-0 mt-1 text-[#dd3e1f]" />
                                <span>{settings.address}</span>
                            </p>
                        </div>

                        <div className="lg:col-span-2">
                            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#dd3e1f]">
                                Jam Operasional
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs text-[#EAE4DC]/80">
                                {(businessHours || []).map((bh) => (
                                    <div
                                        key={bh.day_of_week}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10"
                                    >
                                        <span className="font-semibold block text-[#FFFFFF]">
                                            {DAY_NAMES[bh.day_of_week]}
                                        </span>
                                        {bh.is_closed ? (
                                            <span className="text-red-300">Tutup</span>
                                        ) : (
                                            <span>
                                                {bh.open_time.slice(0, 5)} –{" "}
                                                {bh.close_time.slice(0, 5)} WIB
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EAE4DC]/60 gap-4">
                        <p>
                            &copy; {new Date().getFullYear()} {settings.brand_name}. Hak
                            cipta dilindungi.
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