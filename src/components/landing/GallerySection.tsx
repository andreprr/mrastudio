"use client";

import { useState } from "react";
import { GalleryItem } from "@/types/database";
import { X, Maximize2 } from "lucide-react";

export function GallerySection({ items }: { items: GalleryItem[] }) {
    const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-brand-charcoal/10 bg-brand-beige/40 p-12 text-center">
                <p className="text-brand-gray text-sm">
                    Galeri hasil potongan rambut sedang disiapkan oleh tim MR A Studio.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
                {items.map((item, idx) => {
                    // Variasi span asimetris editorial
                    const colSpan =
                        idx % 5 === 0
                            ? "lg:col-span-7 aspect-[16/11]"
                            : idx % 5 === 1
                                ? "lg:col-span-5 aspect-[4/5]"
                                : "lg:col-span-4 aspect-square";

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedImage(item)}
                            className={`group relative overflow-hidden rounded-3xl bg-brand-beige text-left ${colSpan}`}
                        >
                            <img
                                src={item.image_url}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <span className="text-xs uppercase tracking-widest text-brand-peach">
                                    {item.category}
                                </span>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-brand-cream font-medium text-lg">
                                        {item.title}
                                    </p>
                                    <Maximize2 className="w-4 h-4 text-brand-cream/80" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Modal Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-brand-charcoal/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl w-full bg-brand-cream rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            aria-label="Tutup pratinjau foto"
                            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-brand-charcoal text-brand-cream flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-12">
                            <div className="md:col-span-8 bg-brand-charcoal flex items-center justify-center max-h-[75vh]">
                                <img
                                    src={selectedImage.image_url}
                                    alt={selectedImage.title}
                                    className="w-full h-full object-contain max-h-[75vh]"
                                />
                            </div>
                            <div className="md:col-span-4 p-6 sm:p-8 flex flex-col justify-between">
                                <div>
                                    <span className="inline-block px-3 py-1 rounded-full bg-brand-peach/40 text-brand-espresso text-xs font-semibold uppercase tracking-wider">
                                        {selectedImage.category}
                                    </span>
                                    <h3 className="font-display text-2xl font-bold mt-4 text-brand-charcoal">
                                        {selectedImage.title}
                                    </h3>
                                    {selectedImage.description && (
                                        <p className="text-sm text-brand-gray mt-3 leading-relaxed">
                                            {selectedImage.description}
                                        </p>
                                    )}
                                </div>
                                <a
                                    href="/booking"
                                    className="mt-8 block w-full text-center py-3 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium hover:bg-brand-espresso transition-colors"
                                >
                                    Booking Gaya Ini
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}