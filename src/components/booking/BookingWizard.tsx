"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
    UserCheck,
    Loader2,
    Ticket,
    MessageCircle,
    Search,
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
        const dow = nowJakarta.getDay();
        const bh = businessHours.find((h) => h.day_of_week === dow);

        return {
            dateStr,
            dayLabel: nowJakarta.toLocaleDateString("id-ID", { weekday: "short" }),
            dateNum: nowJakarta.getDate(),
            monthLabel: nowJakarta.toLocaleDateString("id-ID", { month: "short" }),
            isClosed: bh ? bh.is_closed : false,
        };
    });

    // Muat slot dari server saat langkah 4 dibuka atau tanggal/barber berubah
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
                    setStep(4); // Kembalikan ke pemilihan waktu jika slot baru saja diambil orang lain
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
            <div className="max-w-xl mx-auto rounded-2xl bg-brand-beige border border-brand-charcoal/15 p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-brand-charcoal/10 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-brand-charcoal text-brand-cream flex items-center justify-center">
                            <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-widest text-brand-espresso">
                                Tiket Reservasi Digital
                            </span>
                            <h2 className="font-display text-2xl font-bold text-brand-charcoal">
                                {ticket.booking_code}
                            </h2>
                        </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-200/80 text-amber-950">
                        Menunggu Konfirmasi ({ticket.status})
                    </span>
                </div>

                <div className="py-6 space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                        <span className="text-brand-gray">Nama Pelanggan</span>
                        <span className="font-semibold text-brand-charcoal">
                            {ticket.customer_name}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                        <span className="text-brand-gray">Layanan</span>
                        <span className="font-semibold text-brand-charcoal">
                            {ticket.service_name} ({ticket.duration_minutes} menit)
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                        <span className="text-brand-gray">Barber / Stylist</span>
                        <span className="font-semibold text-brand-charcoal">
                            {ticket.barber_name}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                        <span className="text-brand-gray">Tanggal & Jam</span>
                        <span className="font-semibold text-brand-charcoal">
                            {ticket.booking_date} • {ticket.start_time} – {ticket.end_time} WIB
                        </span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-brand-gray">Total Biaya</span>
                        <span className="font-display text-xl font-bold text-brand-charcoal">
                            {formatRupiah(Number(ticket.price))}
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-brand-cream text-xs text-brand-gray leading-relaxed mb-6">
                    Simpan Kode Booking <strong>{ticket.booking_code}</strong> Anda. Slot
                    waktu Anda telah ditahan sementara dan menunggu konfirmasi admin.
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={`/cek-booking?code=${ticket.booking_code}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full border border-brand-charcoal text-brand-charcoal text-sm font-medium hover:bg-brand-charcoal hover:text-brand-cream transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        <span>Cek Booking</span>
                    </Link>
                    {waNumber && (
                        <a
                            href={`https://wa.me/${waNumber}?text=${waText}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium hover:bg-brand-espresso transition-colors"
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
            {/* Progress Bar 6 Langkah */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-brand-gray mb-3">
                    <span>Langkah {step} dari 6</span>
                    <span>
                        {step === 1 && "Pilih Layanan"}
                        {step === 2 && "Pilih Tanggal"}
                        {step === 3 && "Pilih Barber"}
                        {step === 4 && "Pilih Waktu"}
                        {step === 5 && "Data Pelanggan"}
                        {step === 6 && "Konfirmasi Akhir"}
                    </span>
                </div>
                <div className="w-full h-2 rounded-full bg-brand-beige overflow-hidden">
                    <div
                        className="h-full bg-brand-charcoal transition-all duration-300"
                        style={{ width: `${(step / 6) * 100}%` }}
                    />
                </div>
            </div>

            {/* LANGKAH 1: PILIH LAYANAN */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold">
                        1. Pilih Layanan Grooming
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {services.map((srv) => {
                            const selected = watchedServiceId === srv.id;
                            return (
                                <button
                                    key={srv.id}
                                    type="button"
                                    onClick={() => form.setValue("service_id", srv.id)}
                                    className={`w-full text-left p-5 sm:p-6 rounded-xl border transition-all flex items-center justify-between gap-4 ${selected
                                        ? "bg-brand-charcoal text-brand-cream border-brand-charcoal shadow-lg"
                                        : "bg-brand-beige/60 text-brand-charcoal border-brand-charcoal/10 hover:bg-brand-beige"
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <h3 className="font-display text-lg sm:text-xl font-bold">
                                            {srv.name}
                                        </h3>
                                        <p
                                            className={`text-xs sm:text-sm ${selected ? "text-brand-beige/80" : "text-brand-gray"
                                                }`}
                                        >
                                            {srv.description}
                                        </p>
                                        <div className="inline-flex items-center gap-2 text-xs pt-1 opacity-80">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{srv.duration_minutes} menit</span>
                                            <span>•</span>
                                            <span className="font-semibold">
                                                {formatRupiah(Number(srv.price))}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${selected
                                            ? "bg-brand-peach text-brand-charcoal border-brand-peach"
                                            : "border-brand-charcoal/30"
                                            }`}
                                    >
                                        {selected && <Check className="w-4 h-4" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="pt-6 flex justify-end">
                        <button
                            type="button"
                            disabled={!watchedServiceId}
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal text-brand-cream text-xs sm:text-sm font-medium disabled:opacity-40"
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
                        <Calendar className="w-6 h-6" />
                        <span>2. Pilih Tanggal Kunjungan</span>
                    </h2>
                    <p className="text-sm text-brand-gray">
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
                                    className={`p-4 rounded-lg border text-center transition-all ${d.isClosed
                                        ? "opacity-35 cursor-not-allowed bg-brand-beige/20 border-brand-charcoal/5"
                                        : isSelected
                                            ? "bg-brand-charcoal text-brand-cream border-brand-charcoal shadow-md"
                                            : "bg-brand-beige/60 text-brand-charcoal border-brand-charcoal/10 hover:bg-brand-beige"
                                        }`}
                                >
                                    <span className="text-xs uppercase block opacity-75">
                                        {d.dayLabel}
                                    </span>
                                    <span className="font-display text-2xl font-bold block my-1">
                                        {d.dateNum}
                                    </span>
                                    <span className="text-xs block opacity-80">
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
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-charcoal/20 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            disabled={!watchedDate}
                            onClick={() => setStep(3)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium disabled:opacity-40"
                        >
                            <span>Lanjut Pilih Barber</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* LANGKAH 3: PILIH BARBER / STYLIST */}
            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <UserCheck className="w-6 h-6" />
                        <span>3. Pilih Barber / Stylist</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Opsi Barber Mana Saja */}
                        <button
                            type="button"
                            onClick={() => {
                                form.setValue("barber_id", null);
                                form.setValue("start_time", "");
                            }}
                            className={`p-5 rounded-xl border text-left transition-all flex items-center justify-between ${watchedBarberId === null
                                ? "bg-brand-charcoal text-brand-cream border-brand-charcoal"
                                : "bg-brand-beige/60 text-brand-charcoal border-brand-charcoal/10"
                                }`}
                        >
                            <div>
                                <span className="text-xs uppercase tracking-wider opacity-75">
                                    Rekomendasi Fleksibel
                                </span>
                                <h3 className="font-display text-lg font-bold mt-1">
                                    Barber mana saja yang tersedia
                                </h3>
                                <p className="text-xs opacity-80 mt-1">
                                    Sistem akan mengalokasikan barber yang bebas pada jam pilihan Anda.
                                </p>
                            </div>
                            {watchedBarberId === null && <Check className="w-5 h-5 shrink-0" />}
                        </button>

                        {barbers.map((b) => {
                            const selected = watchedBarberId === b.id;
                            return (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => {
                                        form.setValue("barber_id", b.id);
                                        form.setValue("start_time", "");
                                    }}
                                    className={`p-5 rounded-xl border text-left transition-all flex items-center gap-4 ${selected
                                        ? "bg-brand-charcoal text-brand-cream border-brand-charcoal"
                                        : "bg-brand-beige/60 text-brand-charcoal border-brand-charcoal/10"
                                        }`}
                                >
                                    {b.photo_url && (
                                        <img
                                            src={b.photo_url}
                                            alt={b.name}
                                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-display text-lg font-bold">{b.name}</h3>
                                        <p className="text-xs opacity-80">{b.specialty}</p>
                                    </div>
                                    {selected && <Check className="w-5 h-5 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-6 flex justify-between">
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-charcoal/20 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(4)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium"
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
                        <Clock className="w-6 h-6" />
                        <span>4. Pilih Jam Kedatangan</span>
                    </h2>

                    {loadingSlots ? (
                        <div className="py-16 flex flex-col items-center justify-center text-brand-gray gap-3">
                            <Loader2 className="w-7 h-7 animate-spin" />
                            <span className="text-sm">Memeriksa slot yang tersedia...</span>
                        </div>
                    ) : slots.length === 0 ? (
                        <div className="p-5 sm:p-6 rounded-xl bg-brand-beige/50 text-center text-sm text-brand-gray">
                            Tidak ada slot waktu yang tersedia pada tanggal ini. Silakan pilih
                            tanggal atau barber lain.
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
                                        className={`py-3.5 px-4 rounded-lg border text-center transition-all ${!s.available
                                            ? "opacity-35 cursor-not-allowed bg-brand-beige/20 border-brand-charcoal/5 line-through"
                                            : isSelected
                                                ? "bg-brand-charcoal text-brand-cream border-brand-charcoal font-bold shadow-md"
                                                : "bg-brand-beige/60 text-brand-charcoal border-brand-charcoal/10 hover:bg-brand-beige"
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
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-charcoal/20 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Kembali</span>
                        </button>
                        <button
                            type="button"
                            disabled={!watchedStartTime}
                            onClick={() => setStep(5)}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium disabled:opacity-40"
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
                    <p className="text-sm text-brand-gray">
                        Tidak perlu membuat akun atau kata sandi. Nomor WhatsApp digunakan
                        untuk memeriksa status reservasi Anda.
                    </p>

                    <div className="space-y-4 bg-brand-beige/50 p-5 sm:p-6 rounded-xl border border-brand-charcoal/10">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                                Nama Lengkap *
                            </label>
                            <input
                                type="text"
                                {...form.register("customer_name")}
                                placeholder="Masukkan nama lengkap Anda"
                                className="w-full px-4 py-3.5 rounded-lg bg-brand-cream border border-brand-charcoal/15 text-sm focus:outline-none focus:border-brand-charcoal"
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
                                className="w-full px-4 py-3.5 rounded-lg bg-brand-cream border border-brand-charcoal/15 text-sm focus:outline-none focus:border-brand-charcoal"
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
                                className="w-full px-4 py-3 rounded-lg bg-brand-cream border border-brand-charcoal/15 text-sm focus:outline-none focus:border-brand-charcoal"
                            />
                        </div>

                        <label className="flex items-start gap-3 pt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...form.register("agree_terms")}
                                className="mt-1 w-4 h-4 accent-brand-charcoal"
                            />
                            <span className="text-xs text-brand-gray leading-relaxed">
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
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-charcoal/20 text-sm font-medium"
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
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-charcoal text-brand-cream text-sm font-medium"
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

                    <div className="rounded-xl bg-brand-beige/70 border border-brand-charcoal/15 p-5 sm:p-6 space-y-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                            <span className="text-brand-gray">Layanan</span>
                            <span className="font-semibold">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                            <span className="text-brand-gray">Barber Pilihan</span>
                            <span className="font-semibold">
                                {selectedBarber
                                    ? selectedBarber.name
                                    : "Barber mana saja yang tersedia"}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                            <span className="text-brand-gray">Tanggal & Waktu</span>
                            <span className="font-semibold">
                                {watchedDate} • {watchedStartTime} WIB
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                            <span className="text-brand-gray">Estimasi Durasi</span>
                            <span className="font-semibold">
                                {selectedService?.duration_minutes} menit
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                            <span className="text-brand-gray">Nama & WhatsApp</span>
                            <span className="font-semibold">
                                {form.getValues("customer_name")} (
                                {form.getValues("customer_phone")})
                            </span>
                        </div>
                        {form.getValues("customer_note") && (
                            <div className="flex justify-between py-2 border-b border-brand-charcoal/10">
                                <span className="text-brand-gray">Catatan</span>
                                <span className="font-medium max-w-xs text-right">
                                    {form.getValues("customer_note")}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between pt-3 items-center">
                            <span className="text-brand-gray font-medium">Estimasi Harga</span>
                            <span className="font-display text-2xl font-bold text-brand-charcoal">
                                {formatRupiah(Number(selectedService?.price || 0))}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setStep(5)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-brand-charcoal/20 text-sm font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Ubah Data</span>
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={form.handleSubmit(onConfirmBooking)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-charcoal text-brand-cream text-xs sm:text-sm font-medium hover:bg-brand-espresso disabled:opacity-50"
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