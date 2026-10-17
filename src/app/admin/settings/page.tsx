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
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#141413]/10">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                            Konfigurasi Sistem
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
                            Pengaturan Website & Booking
                        </h1>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-widest hover:bg-[#3B281E] transition-all shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Kolom Kiri: Identitas & Konten Editorial */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-7 space-y-5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                                <Sparkles className="w-4 h-4" />
                                <span>Identitas Brand & Hero Banner</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                        Nama Brand Studio
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.brand_name}
                                        onChange={(e) =>
                                            setSettings({ ...settings, brand_name: e.target.value })
                                        }
                                        className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
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
                                        className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
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
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                    Judul Tentang Kami
                                </label>
                                <input
                                    type="text"
                                    value={settings.about_title}
                                    onChange={(e) =>
                                        setSettings({ ...settings, about_title: e.target.value })
                                    }
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                    Cerita Singkat Brand
                                </label>
                                <textarea
                                    rows={3}
                                    value={settings.about_story}
                                    onChange={(e) =>
                                        setSettings({ ...settings, about_story: e.target.value })
                                    }
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Kontak & Parameter Mesin Booking */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-7 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                                <MapPin className="w-4 h-4" />
                                <span>Kontak & Lokasi Studio</span>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                    Nomor WhatsApp Admin (Format 628...)
                                </label>
                                <input
                                    type="text"
                                    placeholder="6281234567890"
                                    value={settings.whatsapp}
                                    onChange={(e) =>
                                        setSettings({ ...settings, whatsapp: e.target.value })
                                    }
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                    Instagram Studio
                                </label>
                                <input
                                    type="text"
                                    placeholder="@mrastudio"
                                    value={settings.instagram}
                                    onChange={(e) =>
                                        setSettings({ ...settings, instagram: e.target.value })
                                    }
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-wider text-[#706D65]">
                                    Alamat Lengkap Studio
                                </label>
                                <textarea
                                    rows={2}
                                    value={settings.address}
                                    onChange={(e) =>
                                        setSettings({ ...settings, address: e.target.value })
                                    }
                                    className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-sm"
                                />
                            </div>
                        </div>

                        <div className="rounded-[2rem] bg-[#141413] text-[#F8F6F1] p-7 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#DFC3B0]">
                                <Sliders className="w-4 h-4" />
                                <span>Parameter Mesin Booking</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#EAE4DC]/70">
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
                                        className="w-full mt-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#EAE4DC]/70">
                                        Rentang Hari ke Depan
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
                                        className="w-full mt-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#EAE4DC]/70">
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
                                    className="w-full mt-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm font-bold text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminShell>
    );
}