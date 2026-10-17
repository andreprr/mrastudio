import { GeneralSettings } from "@/types/database";

export const DEFAULT_SITE_SETTINGS: GeneralSettings = {
    brand_name: "MR A Studio",
    hero_headline: "Your Style. Your Identity.",
    hero_subheadline: "Temukan gaya terbaikmu bersama MR A Studio.",
    about_title: "Presisi dalam Setiap Detail Potongan.",
    about_story:
        "MR A Studio menghadirkan pengalaman potong rambut modern dengan pendekatan personal. Kami memadukan ketelitian teknis, produk perawatan pilihan, dan suasana ruang yang tenang.",
    about_philosophy:
        "Setiap pelanggan memiliki karakter unik. Komitmen kami adalah memastikan Anda keluar dari studio dengan potongan rambut yang presisi, mudah ditata, dan meningkatkan rasa percaya diri.",
    address: "[Alamat belum dikonfigurasi — atur di Pengaturan Admin]",
    whatsapp: "",
    instagram: "",
    cancellation_policy:
        "Mohon hadir tepat waktu. Keterlambatan melebihi batas toleransi dapat menyebabkan jadwal disesuaikan atau dibatalkan.",
    late_tolerance_minutes: 15,
    booking_window_days: 14,
    slot_interval_minutes: 30,
    buffer_minutes: 10,
    pending_expiry_minutes: 60,
};

export function formatRupiah(amount: number): string {
    if (amount === 0) return "Hubungi Admin / Belum Diatur";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("08")) return "62" + digits.slice(1);
    if (digits.startsWith("8")) return "62" + digits;
    return digits;
}