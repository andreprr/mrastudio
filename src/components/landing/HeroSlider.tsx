"use client";

import { useEffect, useRef, useState } from "react";

const slides = [
    { type: "video" as const, src: "/banner%20video%20mra.mp4" },
    { type: "image" as const, src: "/Banner.png" },
];

export function HeroSlider() {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const touchStart = useRef<number | null>(null);

    const goTo = (index: number) =>
        setActive((index + slides.length) % slides.length);
    const next = () => setActive((index) => (index + 1) % slides.length);

    useEffect(() => {
        setPaused(
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    }, []);

    useEffect(() => {
        if (paused) return;
        const timer = window.setTimeout(next, active === 0 ? 12000 : 6000);
        return () => window.clearTimeout(timer);
    }, [active, paused]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (active === 0 && !paused) {
            video.currentTime = 0;
            void video.play().catch(() => undefined);
        } else {
            video.pause();
        }
    }, [active, paused]);

    return (
        <>
            <div
                className="absolute inset-0 z-0 overflow-hidden touch-pan-y bg-[#141413]"
                onTouchStart={(event) => {
                    touchStart.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                    if (touchStart.current === null) return;
                    const distance =
                        touchStart.current -
                        (event.changedTouches[0]?.clientX ?? touchStart.current);
                    if (Math.abs(distance) > 40) {
                        goTo(active + (distance > 0 ? 1 : -1));
                    }
                    touchStart.current = null;
                }}
            >
                <div
                    className="flex h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none"
                    style={{
                        transform: `translate3d(-${active * 100}%, 0, 0)`,
                    }}
                >
                    {slides.map((slide, index) => (
                        <div
                            key={slide.src}
                            className="relative h-full w-full min-w-full shrink-0 grow-0 basis-full overflow-hidden bg-[#141413] flex items-end sm:block"
                        >
                            {slide.type === "video" ? (
                                <video
                                    ref={index === 0 ? videoRef : undefined}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    autoPlay={index === 0 && !paused}
                                    poster="/Banner.png"
                                    className="block w-full h-auto max-h-full sm:h-full object-contain object-bottom sm:object-cover sm:object-center mb-9 sm:mb-0"
                                    onEnded={next}
                                    onError={() => {
                                        if (active === index) next();
                                    }}
                                >
                                    <source src={slide.src} type="video/mp4" />
                                </video>
                            ) : (
                                <img
                                    src={slide.src}
                                    alt="Banner MR A Studio"
                                    draggable={false}
                                    className="block w-full h-auto max-h-full sm:h-full object-contain object-bottom sm:object-cover sm:object-center mb-9 sm:mb-0"
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Kontrol Slider: Lebih ramping di Mobile */}
            <div
                className="pointer-events-auto absolute bottom-11 sm:bottom-20 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 sm:gap-1 rounded-full bg-black/75 border border-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-lg backdrop-blur-md"
                role="group"
                aria-label="Kontrol banner"
            >
                <button
                    type="button"
                    onClick={() => goTo(active - 1)}
                    aria-label="Slide sebelumnya"
                    className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-full text-sm sm:text-xl leading-none text-white hover:bg-white/20 cursor-pointer"
                >
                    ‹
                </button>
                {slides.map((slide, index) => (
                    <button
                        type="button"
                        key={slide.src}
                        onClick={() => goTo(index)}
                        aria-label={`Tampilkan slide ${index + 1}`}
                        aria-pressed={active === index}
                        className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-full cursor-pointer"
                    >
                        <span
                            className={`block rounded-full transition-all ${active === index
                                    ? "h-1.5 sm:h-2 w-3.5 sm:w-6 bg-[#dd3e1f]"
                                    : "h-1.5 sm:h-2 w-1.5 sm:w-2 bg-white/70"
                                }`}
                        />
                    </button>
                ))}
                <button
                    type="button"
                    onClick={next}
                    aria-label="Slide berikutnya"
                    className="grid h-5 w-5 sm:h-8 sm:w-8 place-items-center rounded-full text-sm sm:text-xl leading-none text-white hover:bg-white/20 cursor-pointer"
                >
                    ›
                </button>
                <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    aria-label={
                        paused ? "Putar slide otomatis" : "Jeda slide otomatis"
                    }
                    className="h-5 sm:h-8 rounded-full px-1.5 sm:px-2 text-[9px] sm:text-xs font-semibold text-white hover:bg-white/20 cursor-pointer"
                >
                    {paused ? "Putar" : "Jeda"}
                </button>
            </div>
        </>
    );
}