"use client";

import { useState, useRef } from "react";
import { GalleryItem } from "@/types/database";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";

const CATEGORIES = ["Semua", "Haircut", "Styling", "Studio"];

const isVideoUrl = (url?: string | null) =>
    !!url && /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

function GalleryCard({
    item,
    idx,
    onClick,
    isMuted,
    onToggleMute,
    fixedWidth,
}: {
    item: GalleryItem;
    idx: number;
    onClick: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    fixedWidth?: boolean;
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const isVideo = isVideoUrl(item.image_url);
    const indexLabel = String(idx + 1).padStart(2, "0");

    return (
        <div
            className={`bg-[#EAE4DC]/70 p-2 sm:p-2.5 rounded-xl border border-[#141413]/15 flex flex-col justify-between transition-colors hover:border-[#141413]/40 snap-center sm:snap-start shrink-0 w-full ${fixedWidth
                    ? "sm:w-[250px] md:w-[265px]"
                    : "sm:w-auto sm:shrink"
                }`}
        >
            {/* Top Editorial Meta Bar */}
            <div className="flex items-center justify-between px-1 pb-2 text-[10px] font-mono uppercase tracking-widest text-[#706D65]">
                <span>{indexLabel}</span>
                <span>{item.category}</span>
            </div>

            {/* Media Area */}
            <button
                type="button"
                onClick={onClick}
                className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-[#141413] block text-left"
            >
                {isVideo ? (
                    <>
                        <video
                            src={item.image_url}
                            autoPlay
                            loop
                            playsInline
                            muted={isMuted}
                            className="w-full h-full object-cover"
                        />
                        {/* REEL indicator */}
                        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            REEL
                        </span>
                    </>
                ) : (
                    <>
                        {!isLoaded && (
                            <div className="absolute inset-0 bg-[#EAE4DC] animate-pulse" />
                        )}
                        <img
                            src={item.image_url}
                            alt={item.title}
                            loading="lazy"
                            onLoad={() => setIsLoaded(true)}
                            className={`w-full h-full object-cover ${isLoaded ? "opacity-100" : "opacity-0"
                                }`}
                        />
                    </>
                )}
            </button>

            {/* Mute/Unmute floating button — inside media area but positioned via wrapper */}
            {isVideo && (
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleMute();
                        }}
                        className="absolute -top-10 right-1.5 sm:right-2 z-20 p-1.5 sm:px-2.5 sm:py-1.5 rounded-md bg-[#141413]/80 backdrop-blur-md text-[#F8F6F1] border border-white/15 flex items-center gap-1 sm:gap-1.5 text-[10px] font-mono uppercase hover:bg-[#141413] transition-colors"
                    >
                        {isMuted ? (
                            <>
                                <VolumeX className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">Off</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">On</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Bottom Caption Bar */}
            <div className="pt-2.5 px-1 flex items-center justify-between gap-2">
                <p className="font-display text-xs sm:text-sm font-bold text-[#141413] truncate">
                    {item.title}
                </p>
                <span className="text-[10px] font-mono text-[#3B281E] shrink-0 uppercase">
                    {isVideo ? "VIDEO" : "PHOTO"}
                </span>
            </div>
        </div>
    );
}

export function GallerySection({ items }: { items: GalleryItem[] }) {
    const [selectedCategory, setSelectedCategory] = useState("Semua");
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
    const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-[#141413]/10 bg-[#EAE4DC]/40 p-8 text-center">
                <p className="text-[#706D65] text-sm">
                    Galeri hasil potongan rambut sedang disiapkan oleh tim MR A Studio.
                </p>
            </div>
        );
    }

    const filteredItems =
        selectedCategory === "Semua"
            ? items
            : items.filter(
                (item) =>
                    item.category?.toLowerCase() === selectedCategory.toLowerCase()
            );

    const useSlider = filteredItems.length > 5;

    function scrollByAmount(direction: "left" | "right") {
        if (!scrollRef.current) return;
        // Di mobile geser sejauh lebar container (1 kartu), di desktop geser 285px
        const isMobile = window.innerWidth < 640;
        const amount = isMobile ? scrollRef.current.clientWidth : 285;
        scrollRef.current.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    }

    function toggleMute(id: string) {
        setMutedMap((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
    }

    const isSelectedVideo = isVideoUrl(selectedImage?.image_url);

    return (
        <>
            {/* Filter Kategori + Slider Nav */}
            <div className="flex items-center justify-between gap-2 mb-5 sm:mb-6">
                <div
                    className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0"
                    style={{ scrollbarWidth: "none" }}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs transition-colors whitespace-nowrap shrink-0 border-2 border-[#141413] ${isActive
                                        ? "bg-[#dd3e1f] text-white font-bold shadow-[2px_2px_0px_#141413]"
                                        : "bg-white text-[#141413] font-semibold hover:bg-[#141413] hover:text-white"
                                    }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Tombol navigasi tampil di mobile jika > 1 item, dan di desktop jika > 5 item */}
                {filteredItems.length > 1 && (
                    <div
                        className={`items-center gap-1.5 shrink-0 ${useSlider ? "flex" : "flex sm:hidden"
                            }`}
                    >
                        <button
                            type="button"
                            onClick={() => scrollByAmount("left")}
                            className="px-3 py-1.5 rounded-md bg-[#141413] text-[#F8F6F1] border-2 border-[#141413] hover:border-[#dd3e1f] text-xs flex items-center gap-1 hover:bg-[#dd3e1f] transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByAmount("right")}
                            className="px-3 py-1.5 rounded-md bg-[#141413] text-[#F8F6F1] border-2 border-[#141413] hover:border-[#dd3e1f] text-xs flex items-center gap-1 hover:bg-[#dd3e1f] transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile: Selalu 1 Card Slider | Desktop: Slider jika > 5, Grid jika <= 5 */}
            {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#706D65]">
                    Tidak ada foto dalam kategori {selectedCategory}.
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    className={
                        useSlider
                            ? "flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
                            : "flex sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none pb-4 sm:pb-0"
                    }
                    style={
                        {
                            scrollbarWidth: "none",
                            WebkitOverflowScrolling: "touch",
                        } as React.CSSProperties
                    }
                >
                    {filteredItems.map((item, idx) => (
                        <GalleryCard
                            key={item.id}
                            item={item}
                            idx={idx}
                            onClick={() => setSelectedImage(item)}
                            isMuted={mutedMap[item.id] ?? true}
                            onToggleMute={() => toggleMute(item.id)}
                            fixedWidth={useSlider}
                        />
                    ))}
                </div>
            )}

            {/* Modal Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-[#141413]/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="modal-spring-in relative w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl bg-[#F8F6F1] overflow-hidden shadow-2xl border-t sm:border border-[#141413]/10 max-h-[92vh] sm:max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close + mobile drag hint */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-0 sm:hidden">
                            <div className="w-10 h-1 rounded-full bg-[#141413]/20 mx-auto" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            aria-label="Tutup pratinjau"
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 rounded-full bg-white text-[#141413] border-2 border-[#141413] flex items-center justify-center hover:bg-[#141413] hover:text-white transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="bg-[#141413] flex items-center justify-center flex-1 min-h-0 max-h-[55vh] sm:max-h-[60vh] overflow-hidden">
                            {isSelectedVideo ? (
                                <video
                                    src={selectedImage.image_url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full max-h-[55vh] sm:max-h-[60vh] object-contain bg-black"
                                />
                            ) : (
                                <img
                                    src={selectedImage.image_url}
                                    alt={selectedImage.title}
                                    className="w-full h-full object-contain max-h-[55vh] sm:max-h-[60vh]"
                                />
                            )}
                        </div>
                        <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-[#F8F6F1] shrink-0">
                            <div className="min-w-0 w-full sm:w-auto">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#dd3e1f]/15 text-[#dd3e1f] border border-[#dd3e1f]/40">
                                    {selectedImage.category}
                                </span>
                                <h3 className="font-display text-sm sm:text-base font-bold text-[#141413] mt-1.5 truncate">
                                    {selectedImage.title}
                                </h3>
                                {selectedImage.description && (
                                    <p className="text-xs text-[#706D65] mt-1 line-clamp-2">
                                        {selectedImage.description}
                                    </p>
                                )}
                            </div>
                            <a
                                href="/booking"
                                className="shrink-0 w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-[#dd3e1f] text-white font-bold border-2 border-[#141413] shadow-[2px_2px_0px_#141413] hover:bg-[#141413] transition-colors text-xs uppercase tracking-wider"
                            >
                                Booking Gaya Ini
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}