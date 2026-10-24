"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
    ServiceItem,
    BarberItem,
    BusinessHour,
    GeneralSettings,
} from "@/types/database";
import {
    createBookingSchema,
    CreateBookingInput,
} from "@/lib/validations/booking";
import { formatRupiah } from "@/config/site";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Calendar,
    Loader2,
    Ticket,
    MessageCircle,
    Search,
    Sparkles,
    Layers,
    Ban,
} from "lucide-react";

interface SlotItem {
    time: string;
    available: boolean;
    reason?: string;
}

interface CreatedTicket {
    booking_code: string;
    customer_name: string;
    customer_phone: string;
    service_name: string;
    price: number;
    duration_minutes: number;
    barber_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: string;
}

const SATUAN_CATEGORIES = ["Semua", "Braids", "Chemical", "Haircolor", "Treatment"] as const;

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

export function BookingWizard({
    services,
    barbers,
    businessHours,
    settings,
    initialServiceId,
    initialBarberId,
}: {
    services: ServiceItem[];
    barbers: BarberItem[];
    businessHours: BusinessHour[];
    settings: GeneralSettings;
    initialServiceId?: string;
    initialBarberId?: string;
}) {
    const [step, setStep] = useState<number>(1);
    const [slots, setSlots] = useState<SlotItem[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ticket, setTicket] = useState<CreatedTicket | null>(null);

    // Menyimpan daftar ID barber yang sedang cuti/libur pada tanggal yang dipilih
    const [offBarberIds, setOffBarberIds] = useState<string[]>([]);

    // Pembagian 6 Paket Utama vs Layanan Satuan (Urutan ke-7 dst)
    const packageServices = services.slice(0, 6);
    const singleServices = services.slice(6);

    const isInitialInSingle = singleServices.some((s) => s.id === initialServiceId);
    const [serviceTab, setServiceTab] = useState<"paket" | "satuan">(
        isInitialInSingle ? "satuan" : "paket"
    );
    const [satuanCategory, setSatuanCategory] = useState<string>("Semua");

    const form = useForm<CreateBookingInput>({
        resolver: zodResolver(createBookingSchema),
        defaultValues: {
            service_id: initialServiceId || services[0]?.id || "",
            booking_date: "",
            barber_id: initialBarberId || null,
            start_time: "",
            customer_name: "",
            customer_phone: "",
            customer_note: "",
            agree_terms: false,
        },
    });

    const watchedServiceId = useWatch({
        control: form.control,
        name: "service_id",
    });
    const watchedDate = useWatch({
        control: form.control,
        name: "booking_date",
    });
    const watchedBarberId = useWatch({
        control: form.control,
        name: "barber_id",
    });
    const watchedStartTime = useWatch({
        control: form.control,
        name: "start_time",
    });

    const selectedService = services.find((s) => s.id === watchedServiceId);
    const selectedBarber = barbers.find((b) => b.id === watchedBarberId);

    const filteredSingleServices = singleServices.filter((srv) => {
        if (satuanCategory === "Semua") return true;
        const { category } = parseServiceMeta(srv);
        return category.toLowerCase() === satuanCategory.toLowerCase();
    });

    // Cek jadwal cuti/libur barber berdasarkan tanggal yang dipilih
    useEffect(() => {
        if (!watchedDate) {
            setOffBarberIds([]);
            return;
        }

        let active = true;
        async function checkBarberSchedules() {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from("barber_schedules")
                    .select("barber_id")
                    .eq("schedule_date", watchedDate)
                    .eq("is_available", false);

                if (active && data) {
                    setOffBarberIds(data.map((item) => item.barber_id));
                }
            } catch {
                if (active) setOffBarberIds([]);
            }
        }
        checkBarberSchedules();

        return () => {
            active = false;
        };
    }, [watchedDate]);

    // Bangun daftar tanggal sesuai booking_window_days pada zona waktu Asia/Jakarta
    const availableDates = Array.from({
        length: settings.booking_window_days || 14,
    }).map((_, idx) => {
        const nowJakarta = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
        );
        nowJakarta.setDate(nowJakarta.getDate() + idx);
        const yyyy = nowJakarta.getFullYear();
        const mm = String(nowJakarta.getMonth() + 1).padStart(2, "0");
        const dd = String(nowJakarta.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const [y, m, d] = dateStr.split("-").map(Number);
        const dow = new Date(y, m - 1, d).getDay();
        const bh = businessHours.find((h) => h.day_of_week === dow);

        return {
            dateStr,
            dayLabel: nowJakarta.toLocaleDateString("id-ID", { weekday: "short" }),
            dateNum: nowJakarta.getDate(),
            monthLabel: nowJakarta.toLocaleDateString("id-ID", { month: "short" }),
            isClosed: bh ? bh.is_closed : false,
        };
    });

    // Muat slot dari server saat tanggal/barber berubah
    useEffect(() => {
        if (!watchedDate || !watchedServiceId) return;

        let active = true;
        async function fetchSlots() {
            setLoadingSlots(true);
            try {
                const q = new URLSearchParams({
                    date: watchedDate,
                    serviceId: watchedServiceId,
                    barberId: watchedBarberId || "any",
                });
                const res = await fetch(`/api/bookings?${q.toString()}`);
                const data = await res.json();
                if (active) {
                    setSlots(data.slots || []);
                }
            } catch {
                if (active) setSlots([]);
            } finally {
                if (active) setLoadingSlots(false);
            }
        }
        fetchSlots();
        return () => {
            active = false;
        };
    }, [watchedDate, watchedServiceId, watchedBarberId]);

    async function onConfirmBooking(values: CreateBookingInput) {
        setSubmitting(true);
        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Gagal membuat booking.");
                if (response.status === 409) {
                    setStep(4);
                }
                return;
            }

            setTicket(result.booking);
            setStep(7);
            toast.success("Booking berhasil dibuat!");
        } catch {
            toast.error("Gagal menghubungi server. Periksa koneksi internet Anda.");
        } finally {
            setSubmitting(false);
        }
    }

    // STEP 7: Tiket Digital Booking Berhasil
    if (step === 7 && ticket) {
        const waNumber = settings.whatsapp.replace(/\D/g, "");
        const waText = encodeURIComponent(
            `Halo ${settings.brand_name}, saya ingin mengonfirmasi booking dengan kode *${ticket.booking_code}* atas nama ${ticket.customer_name} pada tanggal ${ticket.booking_date} pukul ${ticket.start_time} WIB.`
        );

        return (
            <div className="max-w-xl mx-auto rounded-2xl bg-[#FFFFFF] border border-[#141413]/15 p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#141413]/10 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#dd3e1f] text-white flex items-center justify-center">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-[#dd3e1f]">
                                Tiket Reservasi Digital
                            </span>
                            <h2 className="font-display text-2xl font-bold text-[#141413]">
                                {ticket.booking_code}
                            </h2>
                        </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-200/80 text-amber-950">
                        Menunggu Konfirmasi ({ticket.status})
                    </span>
                </div>

                <div className="py-6 space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#141413]/10">
                        <span className="text-[#706D65]">Nama Pelanggan</span>
                        <span className="font-semibold text-[#141413]">
                            {ticket.customer_name}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#141413]/10">
                        <span className="text-[#706D65]">Layanan</span>
                        <span className="font-semibold text-[#141413]">
                            {ticket.service_name} ({ticket.duration_minutes} menit)
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#141413]/10">
                        <span className="text-[#706D65]">Barber / Stylist</span>
                        <span className="font-semibold text-[#141413]">
                            {ticket.barber_name}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#141413]/10">
                        <span className="text-[#706D65]">Tanggal & Jam</span>
                        <span className="font-semibold text-[#141413]">
                            {ticket.booking_date} • {ticket.start_time} – {ticket.end_time} WIB
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-[#706D65]">Total Biaya</span>
                        <span className="font-display text-xl font-bold text-[#dd3e1f]">
                            {formatRupiah(Number(ticket.price))}
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-[#F8F6F1] text-xs text-[#706D65] leading-relaxed mb-6">
                    Simpan Kode Booking <strong>{ticket.booking_code}</strong> Anda. Slot
                    waktu Anda telah ditahan sementara dan menunggu konfirmasi admin.
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={`/cek-booking?code=${ticket.booking_code}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full border-2 border-[#141413] text-[#141413] text-sm font-bold hover:bg-[#141413] hover:text-white transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span>Cek Booking</span>
                    </Link>
                    {waNumber && (
                        <a
                            href={`https://wa.me/${waNumber}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-[#dd3e1f] text-white border-2 border-[#141413] hover:bg-[#141413] text-sm font-bold transition-colors shadow-sm"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Hubungi WhatsApp</span>
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar 6 Langkah dengan Aksen Oranye */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#706D65] mb-3">
                    <span>
                        Langkah <strong className="text-[#dd3e1f]">{step}</strong> dari 6
                    </span>
                    <span className="text-[#141413] font-bold">
                        {step === 1 && "Pilih Layanan"}
                        {step === 2 && "Pilih Tanggal"}
                        {step === 3 && "Pilih Barber"}
                        {step === 4 && "Pilih Waktu"}
                        {step === 5 && "Data Pelanggan"}
                        {step === 6 && "Konfirmasi Akhir"}
                    </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EAE4DC] overflow-hidden">
                    <div
                        className="h-full bg-[#dd3e1f] transition-all duration-300"
                        style={{ width: `${(step / 6) * 100}%` }}
                    />
                </div>
            </div>

            {/* LANGKAH 1: PILIH LAYANAN (PAKET VS SATUAN - MINIMALIS TANPA KOTAK BESAR) */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#dd3e1f] block mb-1">
                                Step 01 • Katalog Layanan
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141413]">
                                Pilih Layanan Grooming
                            </h2>
                        </div>

                        {/* Toggle Switch Paket vs Satuan */}
                        {singleServices.length > 0 && (
                            <div className="inline-flex p-1 rounded-xl bg-[#EAE4DC] border border-[#141413]/10 self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setServiceTab("paket")}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${serviceTab === "paket"
                                        ? "bg-[#dd3e1f] text-white shadow-xs"
                                        : "text-[#141413]/70 hover:text-[#141413]"
                                        }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Paket ({packageServices.length})</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setServiceTab("satuan")}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${serviceTab === "satuan"
                                        ? "bg-[#dd3e1f] text-white shadow-xs"
                                        : "text-[#141413]/70 hover:text-[#141413]"
                                        }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>Satuan ({singleServices.length})</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sub-Filter Kategori Khusus Tab Satuan */}
                    {serviceTab === "satuan" && singleServices.length > 0 && (
                        <div
                            className="flex items-center gap-1.5 overflow-x-auto pb-1"
                            style={{ scrollbarWidth: "none" }}
                        >
                            {SATUAN_CATEGORIES.map((cat) => {
                                const active = satuanCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSatuanCategory(cat)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${active
                                            ? "bg-[#141413] text-white"
                                            : "bg-[#EAE4DC]/70 text-[#706D65] hover:bg-[#dd3e1f]/15 hover:text-[#dd3e1f]"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Daftar Layanan Gaya Baris Tipis Modern (Tanpa Kotak Tebal) */}
                    <div className="divide-y divide-[#141413]/10 border-t border-b border-[#141413]/15">
                        {(serviceTab === "paket" ? packageServices : filteredSingleServices).map(
                            (srv, idx) => {
                                const selected = watchedServiceId === srv.id;
                                const { category, cleanDescription } = parseServiceMeta(srv);

                                return (
                                    <button
                                        key={srv.id}
                                        type="button"
                                        onClick={() => form.setValue("service_id", srv.id)}
                                        className={`w-full text-left py-3.5 px-3 sm:px-4 transition-all flex items-center justify-between gap-3 cursor-pointer group ${selected
                                            ? "bg-[#dd3e1f]/10 border-l-4 border-l-[#dd3e1f]"
                                            : "hover:bg-[#EAE4DC]/50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div
                                                className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${selected
                                                    ? "bg-[#dd3e1f] border-[#dd3e1f] text-white"
                                                    : "border-[#141413]/30 group-hover:border-[#dd3e1f]"
                                                    }`}
                                            >
                                                {selected ? (
                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                ) : (
                                                    <span className="text-[9px] font-mono text-[#706D65]">
                                                        {String(idx + 1).padStart(2, "0")}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3
                                                        className={`font-display text-sm sm:text-base font-extrabold tracking-tight transition-colors ${selected
                                                            ? "text-[#dd3e1f]"
                                                            : "text-[#141413] group-hover:text-[#dd3e1f]"
                                                            }`}
                                                    >
                                                        {srv.name}
                                                    </h3>

                                                    {serviceTab === "satuan" && (
                                                        <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#dd3e1f]/15 text-[#dd3e1f]">
                                                            {category}
                                                        </span>
                                                    )}

                                                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#706D65]">
                                                        <Clock className="w-3 h-3 text-[#dd3e1f]" />
                                                        {srv.duration_minutes}m
                                                    </span>
                                                </div>

                                                {cleanDescription && (
                                                    <p className="text-xs text-[#706D65] mt-0.5 line-clamp-1">
                                                        {cleanDescription}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span
                                                className={`font-display text-sm sm:text-base font-extrabold tabular-nums ${selected ? "text-[#dd3e1f]" : "text-[#141413]"
                                                    }`}
                                            >
                                                {formatRupiah(Number(srv.price))}
                                            </span>
                                        </div>
                                    </button>
                                );
                            }
                        )}

                        {serviceTab === "satuan" && filteredSingleServices.length === 0 && (
                            <div className="py-8 text-center text-xs text-[#706D65]">
                                Belum ada layanan pada kategori {satuanCategory}.
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {selectedService ? (
                            <div className="text-xs text-[#706D65]">
                                Terpilih:{" "}
                                <strong className="text-[#141413]">{selectedService.name}</strong>{" "}
                                <span className="text-[#dd3e1f] font-bold">
                                    ({formatRupiah(Number(selectedService.price))})
                                </span>
                            </div>
                        ) : (
                            <div />
                        )}

                        <button
                            type="button"
                            disabled={!watchedServiceId}
                            onClick={() => setStep(2)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#dd3e1f] hover:bg-[#141413] text-white border-2 border-[#141413] shadow-[2px_2px_0px_#141413] text-xs sm:text-sm font-bold disabled:opacity-40 transition-colors cursor-pointer"
                        >
                            <span>Lanjut Pilih Tanggal</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 2: PILIH TANGGAL */}
            {step === 2 && (
                <div className="space-y-6">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-[#dd3e1f]" />
                        <span>2. Pilih Tanggal Kunjungan</span>
                    </h2>
                    <p className="text-sm text-[#706D65]">
                        Zona waktu menggunakan Waktu Indonesia Barat (Asia/Jakarta).
                    </p>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {availableDates.map((d) => {
                            const isSelected = watchedDate === d.dateStr;
                            return (
                                <button
                                    key={d.dateStr}
                                    type="button"
                                    disabled={d.isClosed}
                                    onClick={() => {
                                        form.setValue("booking_date", d.dateStr);
                                        form.setValue("start_time", "");
                                    }}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${d.isClosed
                                        ? "opacity-35 cursor-not-allowed bg-[#EAE4DC]/20 border-[#141413]/20"
                                        : isSelected
                                            ? "bg-[#dd3e1f] text-white border-[#141413] font-bold shadow-[3px_3px_0px_#141413]"
                                            : "bg-[#FFFFFF] text-[#141413] font-bold border-[#141413] hover:bg-[#dd3e1f] hover:text-white"
                                        }`}
                                >
                                    <span className="text-xs uppercase block opacity-80">
                                        {d.dayLabel}
                                    </span>
                                    <span className="font-display text-2xl font-bold block my-1">
                                        {d.dateNum}
                                    </span>
                                    <span className="text-xs block opacity-85">
                                        {d.isClosed ? "Tutup" : d.monthLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-6 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white text-sm font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            disabled={!watchedDate}
                            onClick={() => setStep(3)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#141413] text-white border-2 border-[#141413] hover:border-[#dd3e1f] text-sm font-bold disabled:opacity-40 shadow-sm"
                        >
                            <span>Lanjut Pilih Barber</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 3: PILIH BARBER / STYLIST (UKURAN PAS h-36 sm:h-40 & MOBILE FRIENDLY) */}
            {step === 3 && (
                <div className="space-y-4">
                    <div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#dd3e1f] block mb-1">
                            Step 03 • Tim Profesional
                        </span>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141413]">
                            Pilih Barber / Stylist
                        </h2>
                        {watchedDate && (
                            <p className="text-xs text-[#706D65] mt-1">
                                Jadwal untuk tanggal: <strong className="text-[#141413]">{watchedDate}</strong>
                            </p>
                        )}
                    </div>

                    {/* Opsi Fleksibel (Rekomendasi Cepat) — Dibuat Horizontal Compact agar Tidak Kegedean & Mobile Friendly */}
                    <button
                        type="button"
                        onClick={() => {
                            form.setValue("barber_id", null);
                            form.setValue("start_time", "");
                        }}
                        className={`w-full p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${watchedBarberId === null
                            ? "bg-[#dd3e1f] text-white border-[#141413] shadow-[3px_3px_0px_#141413]"
                            : "bg-[#FFFFFF] text-[#141413] border-[#141413] hover:border-[#dd3e1f]"
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${watchedBarberId === null
                                    ? "bg-white text-[#dd3e1f] border-white"
                                    : "bg-[#141413] text-white border-[#141413]"
                                    }`}
                            >
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-display text-xs sm:text-sm font-extrabold leading-snug">
                                        Siapa Saja (Barber Tersedia)
                                    </h3>
                                    <span
                                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${watchedBarberId === null
                                            ? "bg-white/20 text-white border-white/30"
                                            : "bg-[#dd3e1f]/10 text-[#dd3e1f] border-[#dd3e1f]/30"
                                            }`}
                                    >
                                        Rekomendasi Cepat
                                    </span>
                                </div>
                                <p
                                    className={`text-[11px] mt-0.5 truncate ${watchedBarberId === null ? "text-white/85" : "text-[#706D65]"
                                        }`}
                                >
                                    Alokasi barber otomatis sesuai jam pilihanmu
                                </p>
                            </div>
                        </div>

                        <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${watchedBarberId === null
                                ? "bg-white text-[#dd3e1f] border-[#141413]"
                                : "border-[#141413]/30"
                                }`}
                        >
                            {watchedBarberId === null && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                    </button>

                    {/* Grid Kartu Barber Konsisten (2 Kolom di HP, 3-4 Kolom di Desktop, Tinggi Foto Pas h-36 sm:h-40) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {barbers.map((b) => {
                            const isSelected = watchedBarberId === b.id;
                            const isOff = offBarberIds.includes(b.id);

                            return (
                                <button
                                    key={b.id}
                                    type="button"
                                    disabled={isOff}
                                    onClick={() => {
                                        if (!isOff) {
                                            form.setValue("barber_id", b.id);
                                            form.setValue("start_time", "");
                                        }
                                    }}
                                    className={`rounded-xl border-2 overflow-hidden text-left transition-all flex flex-col justify-between group ${isOff
                                        ? "opacity-45 cursor-not-allowed bg-[#EAE4DC]/40 border-[#141413]/20"
                                        : isSelected
                                            ? "bg-[#dd3e1f] text-white border-[#141413] shadow-[3px_3px_0px_#141413] -translate-y-0.5 cursor-pointer"
                                            : "bg-[#FFFFFF] text-[#141413] border-[#141413] hover:border-[#dd3e1f] cursor-pointer"
                                        }`}
                                >
                                    {/* Area Foto Ukuran Pas & Konsisten (h-36 di HP, sm:h-40 di layar lebih besar) */}
                                    <div className="relative w-full h-36 sm:h-40 bg-[#141413] overflow-hidden">
                                        {b.photo_url ? (
                                            <img
                                                src={b.photo_url}
                                                alt={b.name}
                                                className={`w-full h-full object-cover object-top transition-transform duration-500 ${isOff ? "grayscale" : "group-hover:scale-105"
                                                    }`}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#141413] text-white font-display font-extrabold text-2xl">
                                                {b.name.charAt(0)}
                                            </div>
                                        )}

                                        {/* Badge Status di Pojok Kanan Atas Foto */}
                                        <div className="absolute top-2 right-2">
                                            {isOff ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-600 text-white font-bold shadow-sm">
                                                    <Ban className="w-2.5 h-2.5" />
                                                    LIBUR
                                                </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold backdrop-blur-md border shadow-sm ${isSelected
                                                        ? "bg-[#dd3e1f] text-white border-white/40"
                                                        : "bg-[#141413]/75 text-white border-white/15"
                                                        }`}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    Aktif
                                                </span>
                                            )}
                                        </div>

                                        {/* Tanda Centang jika Terpilih */}
                                        {isSelected && !isOff && (
                                            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#dd3e1f] text-white border-2 border-[#141413] flex items-center justify-center shadow-md">
                                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Nama & Spesialisasi di Bawah Foto */}
                                    <div className="p-2.5 sm:p-3">
                                        <h3
                                            className={`font-display text-xs sm:text-sm font-extrabold leading-snug truncate ${isOff ? "line-through" : ""
                                                }`}
                                        >
                                            {b.name}
                                        </h3>
                                        <p
                                            className={`text-[11px] mt-0.5 truncate ${isOff
                                                ? "text-red-600 font-semibold"
                                                : isSelected
                                                    ? "text-white/90"
                                                    : "text-[#706D65]"
                                                }`}
                                        >
                                            {isOff ? "Tidak tersedia" : b.specialty}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-4 flex justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-full border-2 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white text-xs sm:text-sm font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#141413] text-white border-2 border-[#141413] hover:border-[#dd3e1f] text-xs sm:text-sm font-bold shadow-sm"
                        >
                            <span>Lanjut Pilih Waktu</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 4: PILIH WAKTU */}
            {step === 4 && (
                <div className="space-y-6">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Clock className="w-6 h-6 text-[#dd3e1f]" />
                        <span>4. Pilih Jam Kedatangan</span>
                    </h2>

                    {loadingSlots ? (
                        <div className="py-16 flex flex-col items-center justify-center text-[#706D65] gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-[#dd3e1f]" />
                            <span className="text-sm font-medium">Memeriksa slot yang tersedia...</span>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="p-6 rounded-xl bg-white border-2 border-[#141413] text-center text-sm text-[#141413]">
                            Tidak ada slot waktu yang tersedia pada tanggal ini. Silakan pilih
                            tanggal atau barber lain.
                        </div>
                    ) : slots.every((s) => !s.available) ? (
                        <div className="p-6 rounded-xl bg-white border-2 border-[#141413] text-center text-sm text-[#141413] space-y-3">
                            <p className="font-bold text-base">
                                Semua slot waktu untuk hari ini sudah lewat atau penuh.
                            </p>
                            <p className="text-xs text-[#706D65]">
                                Silakan pilih tanggal <strong>besok</strong> atau hari berikutnya
                                untuk reservasi jadwal dengan leluasa.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#dd3e1f] text-white border-2 border-[#141413] text-xs font-bold shadow-[2px_2px_0px_#141413] hover:bg-[#141413] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Pilih Tanggal Lain</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {slots.map((s) => {
                                const isSelected = watchedStartTime === s.time;
                                return (
                                    <button
                                        key={s.time}
                                        type="button"
                                        disabled={!s.available}
                                        onClick={() => form.setValue("start_time", s.time)}
                                        className={`py-3.5 px-4 rounded-xl border-2 text-center transition-all ${!s.available
                                            ? "opacity-35 cursor-not-allowed bg-[#EAE4DC]/20 border-[#141413]/20 line-through"
                                            : isSelected
                                                ? "bg-[#dd3e1f] text-white border-[#141413] font-bold shadow-[3px_3px_0px_#141413]"
                                                : "bg-white text-[#141413] font-bold border-[#141413] hover:bg-[#dd3e1f] hover:text-white"
                                            }`}
                                    >
                                        <span className="text-sm block">{s.time} WIB</span>
                                        {!s.available && s.reason && (
                                            <span className="text-[10px] block opacity-75">
                                                {s.reason}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-6 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(3)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white text-sm font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            disabled={!watchedStartTime}
                            onClick={() => setStep(5)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#141413] text-white border-2 border-[#141413] hover:border-[#dd3e1f] text-sm font-bold disabled:opacity-40 shadow-sm"
                        >
                            <span>Isi Data Pelanggan</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 5: ISI DATA PELANGGAN */}
            {step === 5 && (
                <div className="space-y-6">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold">
                        5. Informasi Pelanggan
                    </h2>
                    <p className="text-sm text-[#706D65]">
                        Tidak perlu membuat akun atau kata sandi. Nomor WhatsApp digunakan
                        untuk memeriksa status reservasi Anda.
                    </p>

                    <div className="space-y-4 bg-[#F8F6F1] p-5 sm:p-6 rounded-xl border border-[#141413]/10">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                                Nama Lengkap *
                            </label>
                            <input
                                type="text"
                                {...form.register("customer_name")}
                                placeholder="Masukkan nama lengkap Anda"
                                className="w-full px-4 py-3.5 rounded-lg bg-[#FFFFFF] border border-[#141413]/15 text-sm focus:outline-none focus:border-[#dd3e1f]"
                            />
                            {form.formState.errors.customer_name && (
                                <p className="text-xs text-red-600 mt-1">
                                    {form.formState.errors.customer_name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                                Nomor WhatsApp Aktif *
                            </label>
                            <input
                                type="tel"
                                {...form.register("customer_phone")}
                                placeholder="Contoh: 081234567890"
                                className="w-full px-4 py-3.5 rounded-lg bg-[#FFFFFF] border border-[#141413]/15 text-sm focus:outline-none focus:border-[#dd3e1f]"
                            />
                            {form.formState.errors.customer_phone && (
                                <p className="text-xs text-red-600 mt-1">
                                    {form.formState.errors.customer_phone.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                                Catatan Tambahan (Opsional)
                            </label>
                            <textarea
                                rows={3}
                                {...form.register("customer_note")}
                                placeholder="Contoh: Ingin diskusi gaya taper fade yang rapi untuk kerja"
                                className="w-full px-4 py-3 rounded-lg bg-[#FFFFFF] border border-[#141413]/15 text-sm focus:outline-none focus:border-[#dd3e1f]"
                            />
                        </div>

                        <label className="flex items-start gap-3 pt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...form.register("agree_terms")}
                                className="mt-1 w-4 h-4 accent-[#dd3e1f]"
                            />
                            <span className="text-xs text-[#706D65] leading-relaxed">
                                Saya menyetujui aturan booking ({settings.cancellation_policy})
                                serta kebijakan privasi {settings.brand_name}.
                            </span>
                        </label>
                        {form.formState.errors.agree_terms && (
                            <p className="text-xs text-red-600">
                                {form.formState.errors.agree_terms.message}
                            </p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white text-sm font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                const valid = await form.trigger([
                                    "customer_name",
                                    "customer_phone",
                                    "customer_note",
                                    "agree_terms",
                                ]);
                                if (valid) setStep(6);
                            }}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#141413] text-white border-2 border-[#141413] hover:border-[#dd3e1f] text-sm font-bold shadow-sm"
                        >
                            <span>Tinjau Konfirmasi</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 6: RINGKASAN & KONFIRMASI */}
            {step === 6 && (
                <div className="space-y-6">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold">
                        6. Konfirmasi Reservasi Anda
                    </h2>

                    <div className="rounded-xl bg-[#F8F6F1] border border-[#141413]/15 p-5 sm:p-6 space-y-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-[#141413]/10">
                            <span className="text-[#706D65]">Layanan</span>
                            <span className="font-semibold text-[#dd3e1f]">
                                {selectedService?.name}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#141413]/10">
                            <span className="text-[#706D65]">Barber Pilihan</span>
                            <span className="font-semibold">
                                {selectedBarber
                                    ? selectedBarber.name
                                    : "Barber mana saja yang tersedia"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#141413]/10">
                            <span className="text-[#706D65]">Tanggal & Waktu</span>
                            <span className="font-semibold">
                                {watchedDate} • {watchedStartTime} WIB
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#141413]/10">
                            <span className="text-[#706D65]">Estimasi Durasi</span>
                            <span className="font-semibold">
                                {selectedService?.duration_minutes} menit
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#141413]/10">
                            <span className="text-[#706D65]">Nama & WhatsApp</span>
                            <span className="font-semibold">
                                {form.getValues("customer_name")} (
                                {form.getValues("customer_phone")})
                            </span>
                        </div>
                        {form.getValues("customer_note") && (
                            <div className="flex justify-between py-2 border-b border-[#141413]/10">
                                <span className="text-[#706D65]">Catatan</span>
                                <span className="font-medium max-w-xs text-right">
                                    {form.getValues("customer_note")}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-3 items-center">
                            <span className="text-[#706D65] font-medium">Estimasi Harga</span>
                            <span className="font-display text-2xl font-bold text-[#dd3e1f]">
                                {formatRupiah(Number(selectedService?.price || 0))}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setStep(5)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#141413] text-[#141413] hover:bg-[#141413] hover:text-white text-sm font-bold transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Ubah Data</span>
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={form.handleSubmit(onConfirmBooking)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#dd3e1f] text-white font-bold border-2 border-[#141413] shadow-[2px_2px_0px_#141413] hover:bg-[#141413] transition-colors disabled:opacity-50 text-sm"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memproses Booking...</span>
                                </>
                            ) : (
                                <>
                                    <span>Konfirmasi Booking</span>
                                    <Check className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}