"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { BarberItem } from "@/types/database";
import { toast } from "sonner";
import {
    Plus,
    Pencil,
    Trash2,
    Upload,
    Loader2,
    X,
    Sparkles,
    UserCheck,
} from "lucide-react";

export default function AdminTeamPage() {
    const [barbers, setBarbers] = useState<BarberItem[]>([]);
    const [loading, setLoading] = useState(true);

    // State Modal Tambah / Edit Barber
    const [editingBarber, setEditingBarber] =
        useState<Partial<BarberItem> | null>(null);
    // State Modal Konfirmasi Hapus
    const [deletingBarber, setDeletingBarber] = useState<BarberItem | null>(null);

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saving, setSaving] = useState(false);

    const refreshBarbers = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("barbers")
            .select("*")
            .order("created_at", { ascending: true });
        setBarbers((data as BarberItem[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function initLoad() {
            const supabase = createClient();
            const { data } = await supabase
                .from("barbers")
                .select("*")
                .order("created_at", { ascending: true });
            if (!ignore) {
                setBarbers((data as BarberItem[]) || []);
                setLoading(false);
            }
        }
        initLoad();
        return () => {
            ignore = true;
        };
    }, []);

    // Fungsi Upload Foto langsung ke Supabase Storage bucket "studio-assets"
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !editingBarber) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Format foto harus berupa JPG, PNG, atau WEBP.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran foto maksimal 5 MB.");
            return;
        }

        setUploadingPhoto(true);
        try {
            const supabase = createClient();
            const ext = file.name.split(".").pop() || "jpg";
            const fileName = `barbers/barber-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("studio-assets")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                toast.error(
                    "Gagal mengunggah foto ke Storage: " + uploadError.message
                );
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("studio-assets").getPublicUrl(fileName);

            setEditingBarber({
                ...editingBarber,
                photo_url: publicUrl,
            });
            toast.success("Foto barber berhasil diunggah!");
        } catch {
            toast.error("Terjadi kesalahan saat mengunggah foto.");
        } finally {
            setUploadingPhoto(false);
        }
    }

    async function handleSaveBarber(e: React.FormEvent) {
        e.preventDefault();
        if (!editingBarber?.name || !editingBarber?.specialty) {
            toast.error("Nama dan Spesialisasi barber wajib diisi.");
            return;
        }

        setSaving(true);
        const supabase = createClient();

        if (editingBarber.id) {
            const { error } = await supabase
                .from("barbers")
                .update({
                    name: editingBarber.name,
                    specialty: editingBarber.specialty,
                    bio: editingBarber.bio || null,
                    photo_url: editingBarber.photo_url || null,
                    card_theme: editingBarber.card_theme || "beige",
                    is_active: editingBarber.is_active ?? true,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", editingBarber.id);

            setSaving(false);
            if (error) {
                toast.error("Gagal memperbarui profil barber.");
                return;
            }
            toast.success(`Profil "${editingBarber.name}" berhasil diperbarui!`);
        } else {
            const { error } = await supabase.from("barbers").insert({
                name: editingBarber.name,
                specialty: editingBarber.specialty,
                bio: editingBarber.bio || null,
                photo_url: editingBarber.photo_url || null,
                card_theme: editingBarber.card_theme || "beige",
                is_active: editingBarber.is_active ?? true,
            });

            setSaving(false);
            if (error) {
                toast.error("Gagal menambahkan barber: " + error.message);
                return;
            }
            toast.success(`Barber "${editingBarber.name}" berhasil ditambahkan!`);
        }

        setEditingBarber(null);
        await refreshBarbers();
    }

    async function confirmDeleteBarber() {
        if (!deletingBarber) return;
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("barbers")
            .delete()
            .eq("id", deletingBarber.id);
        setSaving(false);

        if (error) {
            toast.error("Gagal menghapus barber.");
            return;
        }
        toast.success(`Profil "${deletingBarber.name}" telah dihapus.`);
        setDeletingBarber(null);
        await refreshBarbers();
    }

    return (
        <AdminShell>
            {/* Header & Tombol Tambah Barber */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#141413]/10 mb-8">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                        Manajemen Stylist
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
                        Tim Barber MR A Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-[#706D65] mt-1">
                        Kelola foto potret, spesialisasi potongan, dan status ketersediaan
                        barber untuk sistem booking.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setEditingBarber({
                            name: "",
                            specialty: "Classic Taper & Fade",
                            bio: "",
                            photo_url: "",
                            card_theme: "beige",
                            is_active: true,
                        })
                    }
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shadow-md shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Barber Baru</span>
                </button>
            </div>

            {/* Daftar Kartu Barber (Gaya Gambar 2) */}
            {loading ? (
                <p className="text-sm text-[#706D65]">Memuat data tim barber...</p>
            ) : barbers.length === 0 ? (
                <div className="rounded-[2rem] bg-[#EAE4DC]/50 p-12 text-center">
                    <p className="font-display text-lg font-bold">
                        Belum ada data barber.
                    </p>
                    <p className="text-xs text-[#706D65] mt-1">
                        Klik tombol &ldquo;Tambah Barber Baru&rdquo; di kanan atas untuk
                        mengunggah foto dan profil barber.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {barbers.map((barber) => (
                        <div
                            key={barber.id}
                            className="rounded-[2.4rem] bg-white p-4 shadow-md border border-[#141413]/10 flex flex-col justify-between"
                        >
                            {/* Area Potret Atas ala Kartu Sienna Brooks */}
                            <div className="rounded-[1.9rem] bg-[#EAE4DC]/65 pt-7 px-5 pb-0 flex flex-col items-center text-center overflow-hidden">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span
                                        className={`w-2 h-2 rounded-full ${barber.is_active ? "bg-emerald-500" : "bg-stone-400"
                                            }`}
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#706D65]">
                                        {barber.is_active ? "Aktif di Booking" : "Nonaktif"}
                                    </span>
                                </div>

                                <h3 className="font-display text-2xl font-extrabold text-[#141413]">
                                    {barber.name}
                                </h3>
                                <p className="text-xs text-[#3B281E] font-semibold mt-0.5 mb-4">
                                    {barber.specialty}
                                </p>

                                <div className="w-full aspect-square rounded-t-2xl overflow-hidden bg-[#DFC3B0]/30">
                                    {barber.photo_url ? (
                                        <img
                                            src={barber.photo_url}
                                            alt={barber.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-[#706D65] font-medium">
                                            Belum Ada Foto
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Kartu Admin */}
                            <div className="pt-4 pb-1 px-2 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingBarber({ ...barber })}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#141413] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit / Ganti Foto</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingBarber(barber)}
                                    aria-label="Hapus barber"
                                    className="p-3 rounded-2xl bg-red-500/10 text-red-800 hover:bg-red-600 hover:text-white transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM TAMBAH / EDIT BARBER & UPLOAD FOTO */}
            {editingBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setEditingBarber(null)}
                >
                    <div
                        className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-7 sm:p-9 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setEditingBarber(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#EAE4DC] flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFC3B0]/60 text-[#3B281E] text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                                {editingBarber.id ? "Edit Profil Barber" : "Barber Baru"}
                            </span>
                        </div>

                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                            {editingBarber.id ? editingBarber.name : "Tambah Stylist Studio"}
                        </h2>

                        <form onSubmit={handleSaveBarber} className="mt-6 space-y-4">
                            {/* Upload Foto Potret Barber */}
                            <div className="p-4 rounded-2xl bg-[#EAE4DC]/70 border border-[#141413]/10 flex flex-col sm:flex-row items-center gap-4">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#141413]/10 shrink-0 border border-[#141413]/15">
                                    {editingBarber.photo_url ? (
                                        <img
                                            src={editingBarber.photo_url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#706D65] font-bold text-center p-2">
                                            Pratinjau Foto
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-2">
                                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-[#3B281E] transition-colors w-full sm:w-auto">
                                        {uploadingPhoto ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Mengunggah...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>Upload Foto dari Perangkat</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileUpload}
                                            disabled={uploadingPhoto}
                                            className="hidden"
                                        />
                                    </label>

                                    <input
                                        type="url"
                                        value={editingBarber.photo_url || ""}
                                        onChange={(e) =>
                                            setEditingBarber({
                                                ...editingBarber,
                                                photo_url: e.target.value,
                                            })
                                        }
                                        placeholder="Atau tempel URL foto langsung (https://...)"
                                        className="w-full px-3.5 py-2 rounded-xl bg-[#F8F6F1] border border-[#141413]/15 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Nama Lengkap / Panggilan *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingBarber.name || ""}
                                        onChange={(e) =>
                                            setEditingBarber({
                                                ...editingBarber,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Contoh: Sienna Brooks / Raka"
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Spesialisasi Gaya *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editingBarber.specialty || ""}
                                        onChange={(e) =>
                                            setEditingBarber({
                                                ...editingBarber,
                                                specialty: e.target.value,
                                            })
                                        }
                                        placeholder="Contoh: Modern Mullet & Skin Fade"
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                    Deskripsi / Bio Singkat
                                </label>
                                <textarea
                                    rows={3}
                                    value={editingBarber.bio || ""}
                                    onChange={(e) =>
                                        setEditingBarber({
                                            ...editingBarber,
                                            bio: e.target.value,
                                        })
                                    }
                                    placeholder="Pengalaman, karakter potongan, atau sapaan singkat..."
                                    className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Tema Warna Kartu
                                    </label>
                                    <select
                                        value={editingBarber.card_theme || "beige"}
                                        onChange={(e) =>
                                            setEditingBarber({
                                                ...editingBarber,
                                                card_theme: e.target.value as BarberItem["card_theme"],
                                            })
                                        }
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    >
                                        <option value="beige">Warm Beige</option>
                                        <option value="peach">Soft Peach</option>
                                        <option value="charcoal">Charcoal Dark</option>
                                        <option value="cream">Editorial Cream</option>
                                    </select>
                                </div>

                                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer mt-5">
                                    <input
                                        type="checkbox"
                                        checked={editingBarber.is_active ?? true}
                                        onChange={(e) =>
                                            setEditingBarber({
                                                ...editingBarber,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 accent-[#141413]"
                                    />
                                    <span className="flex items-center gap-1">
                                        <UserCheck className="w-4 h-4" />
                                        Aktifkan di Sistem Booking
                                    </span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingBarber(null)}
                                    className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase tracking-wider"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploadingPhoto}
                                    className="px-7 py-3 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] disabled:opacity-50"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Barber"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS BARBER */}
            {deletingBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingBarber(null)}
                >
                    <div
                        className="max-w-md w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-display text-2xl font-extrabold">
                            Hapus Profil &ldquo;{deletingBarber.name}&rdquo;?
                        </h3>
                        <p className="text-xs text-[#706D65] mt-2 leading-relaxed">
                            Barber ini tidak akan lagi muncul di halaman utama maupun pilihan
                            booking baru, tetapi riwayat transaksi lama tetap aman.
                        </p>
                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingBarber(null)}
                                className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={confirmDeleteBarber}
                                className="px-6 py-3 rounded-full bg-red-700 text-white text-xs font-bold uppercase hover:bg-red-800"
                            >
                                {saving ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}