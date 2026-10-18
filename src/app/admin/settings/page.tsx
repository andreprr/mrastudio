"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEFAULT_SITE_SETTINGS } from "@/config/site";
import { GeneralSettings } from "@/types/database";
import { toast } from "sonner";
import { Save, Sparkles, Sliders, MapPin } from "lucide-react";

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<GeneralSettings>(
        DEFAULT_SITE_SETTINGS
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
            const supabase = createClient();
            const { data } = await supabase
                .from("site_settings")
                .select("value")
                .eq("key", "general")
                .single();
            if (!ignore && data?.value) {
                setSettings({ ...DEFAULT_SITE_SETTINGS, ...data.value });
            }
        }
        load();
        return () => {
            ignore = true;
        };
    }, []);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from("site_settings").upsert({
            key: "general",
            value: settings,
            updated_at: new Date().toISOString(),
        });
        setSaving(false);

        if (error) {
            toast.error("Gagal menyimpan pengaturan website.");
            return;
        }
        toast.success("Pengaturan website dan mesin booking berhasil disimpan!");
    }

    return (
        <AdminShell>
            <form onSubmit={handleSave} className="space-y-8">
                {/* Header Architectural */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DD]">
                    <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                            Konfigurasi Sistem
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight text-[#111110] mt-1">
                            Pengaturan Website & Booking
                        </h1>
                        <p className="text-xs text-[#6E6D68] mt-1">
                            Kelola identitas merek, narasi editorial, saluran komunikasi, serta parameter mesin penjadwalan studio.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shadow-sm self-start sm:self-auto"
                    >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
                    </button>
                </div>

                {/* Section 1: Identitas Brand & Hero Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#111110]">
                            <Sparkles className="w-3.5 h-3.5 text-[#C89D7C]" />
                            <span>Identitas & Narasi</span>
                        </div>
                        <h2 className="text-sm font-bold text-[#111110] mt-1">
                            Brand & Teks Beranda
                        </h2>
                        <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                            Informasi ini tampil di seluruh website publik, termasuk navigasi, hero section, dan segmen profil brand.
                        </p>
                    </div>

                    <div className="lg:col-span-8 bg-white border border-[#E4E2DD] rounded-md p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    Nama Brand Studio
                                </label>
                                <input
                                    type="text"
                                    value={settings.brand_name}
                                    onChange={(e) =>
                                        setSettings({ ...settings, brand_name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-medium text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    Headline Hero Utama
                                </label>
                                <input
                                    type="text"
                                    value={settings.hero_headline}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            hero_headline: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-medium text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                Subheadline Hero
                            </label>
                            <input
                                type="text"
                                value={settings.hero_subheadline}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        hero_subheadline: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                Judul Tentang Kami
                            </label>
                            <input
                                type="text"
                                value={settings.about_title}
                                onChange={(e) =>
                                    setSettings({ ...settings, about_title: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-medium text-[#111110] focus:outline-none focus:border-[#111110]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                Cerita Singkat Brand
                            </label>
                            <textarea
                                rows={3}
                                value={settings.about_story}
                                onChange={(e) =>
                                    setSettings({ ...settings, about_story: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-[#E4E2DD]" />

                {/* Section 2: Kontak & Lokasi Studio */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#111110]">
                            <MapPin className="w-3.5 h-3.5 text-[#C89D7C]" />
                            <span>Kontak & Lokasi</span>
                        </div>
                        <h2 className="text-sm font-bold text-[#111110] mt-1">
                            Akses Komunikasi & Alamat
                        </h2>
                        <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                            Kanal resmi bagi pelanggan untuk konfirmasi booking otomatis melalui WhatsApp dan arahan navigasi studio.
                        </p>
                    </div>

                    <div className="lg:col-span-8 bg-white border border-[#E4E2DD] rounded-md p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    WhatsApp Admin (Format 628...)
                                </label>
                                <input
                                    type="text"
                                    placeholder="6281234567890"
                                    value={settings.whatsapp}
                                    onChange={(e) =>
                                        setSettings({ ...settings, whatsapp: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    Instagram Studio
                                </label>
                                <input
                                    type="text"
                                    placeholder="@mrastudio"
                                    value={settings.instagram}
                                    onChange={(e) =>
                                        setSettings({ ...settings, instagram: e.target.value })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                Alamat Lengkap Studio
                            </label>
                            <textarea
                                rows={2}
                                value={settings.address}
                                onChange={(e) =>
                                    setSettings({ ...settings, address: e.target.value })
                                }
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-[#E4E2DD]" />

                {/* Section 3: Parameter Mesin Booking */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#111110]">
                            <Sliders className="w-3.5 h-3.5 text-[#C89D7C]" />
                            <span>Mesin Penjadwalan</span>
                        </div>
                        <h2 className="text-sm font-bold text-[#111110] mt-1">
                            Parameter Algoritma Booking
                        </h2>
                        <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                            Menentukan batas buffer antar janji temu, rentang tanggal ke depan yang dapat dipesan, dan batas waktu kedaluwarsa reservasi pending.
                        </p>
                    </div>

                    <div className="lg:col-span-8 bg-white border border-[#E4E2DD] rounded-md p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    Buffer Antar-Slot (Menit)
                                </label>
                                <input
                                    type="number"
                                    value={settings.buffer_minutes}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            buffer_minutes: Number(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                    Rentang Pemesanan (Hari ke Depan)
                                </label>
                                <input
                                    type="number"
                                    value={settings.booking_window_days}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            booking_window_days: Number(e.target.value),
                                        })
                                    }
                                    className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                Masa Berlaku Pending Booking (Menit)
                            </label>
                            <input
                                type="number"
                                value={settings.pending_expiry_minutes}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        pending_expiry_minutes: Number(e.target.value),
                                    })
                                }
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </AdminShell>
    );
}