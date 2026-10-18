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
                    card_theme: editingBarber.card_theme || "charcoal",
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
                card_theme: editingBarber.card_theme || "charcoal",
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E2DD] mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111110]">
                        Tim Stylist & Barber
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-0.5">
                        Kelola foto profil, spesialisasi, dan status ketersediaan barber studio.
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
                            card_theme: "charcoal",
                            is_active: true,
                        })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Barber</span>
                </button>
            </div>

            {/* Daftar Kartu Barber */}
            {loading ? (
                <div className="py-16 text-center text-xs text-[#6E6D68] bg-white border border-[#E4E2DD] rounded-md">
                    Memuat data tim barber...
                </div>
            ) : barbers.length === 0 ? (
                <div className="bg-white border border-[#E4E2DD] rounded-md p-8 text-center">
                    <p className="text-sm font-semibold text-[#111110]">Belum ada data barber.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {barbers.map((barber) => (
                        <div
                            key={barber.id}
                            className="bg-white border border-[#E4E2DD] rounded-md overflow-hidden flex flex-col justify-between shadow-sm"
                        >
                            <div>
                                <div className="w-full aspect-[4/5] bg-[#F6F5F2] overflow-hidden relative border-b border-[#E4E2DD]">
                                    {barber.photo_url ? (
                                        <img
                                            src={barber.photo_url}
                                            alt={barber.name}
                                            className="w-full h-full object-cover object-top"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-[#6E6D68]">
                                            Belum Ada Foto
                                        </div>
                                    )}
                                    <div className="absolute top-2.5 left-2.5">
                                        <span
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border backdrop-blur-md ${
                                                barber.is_active
                                                    ? "bg-white/90 text-emerald-800 border-emerald-200"
                                                    : "bg-white/90 text-zinc-600 border-zinc-200"
                                            }`}
                                        >
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    barber.is_active ? "bg-emerald-500" : "bg-stone-400"
                                                }`}
                                            />
                                            {barber.is_active ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5">
                                    <h3 className="font-semibold text-sm text-[#111110] truncate">
                                        {barber.name}
                                    </h3>
                                    <p className="text-xs text-[#6E6D68] truncate mt-0.5">
                                        {barber.specialty}
                                    </p>
                                    {barber.bio && (
                                        <p className="text-[11px] text-[#6E6D68] line-clamp-2 mt-2 leading-relaxed">
                                            {barber.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 pt-0 border-t border-[#E4E2DD] mt-2 flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setEditingBarber({ ...barber })}
                                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2] transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeletingBarber(barber)}
                                    aria-label="Hapus barber"
                                    className="p-1.5 rounded-md text-[#6E6D68] hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SLIDE-OVER DRAWER FORM TAMBAH / EDIT BARBER */}
            {editingBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
                    onClick={() => setEditingBarber(null)}
                >
                    <div
                        className="w-full max-w-md bg-white border-l border-[#E4E2DD] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DD]">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C89D7C] block">
                                        Team Stylist
                                    </span>
                                    <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                        {editingBarber.id ? "Edit Profil Stylist" : "Tambah Stylist Baru"}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingBarber(null)}
                                    className="p-1.5 rounded-md hover:bg-[#F6F5F2] text-[#6E6D68] hover:text-[#111110]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form id="barber-form" onSubmit={handleSaveBarber} className="mt-5 space-y-4">
                                {/* Upload Foto Potret Barber */}
                                <div className="p-3.5 rounded-md bg-[#F6F5F2] border border-[#E4E2DD] flex items-center gap-3.5">
                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-white border border-[#E4E2DD] shrink-0">
                                        {editingBarber.photo_url ? (
                                            <img
                                                src={editingBarber.photo_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover object-top"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#6E6D68] text-center p-1">
                                                Foto
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111110] text-white text-xs font-medium cursor-pointer hover:bg-[#2A2A28] transition-colors">
                                            {uploadingPhoto ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Upload...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3.5 h-3.5" />
                                                    <span>Pilih File Foto</span>
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
                                            placeholder="Atau tempel URL foto..."
                                            className="w-full px-2.5 py-1 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
                                        Nama Stylist *
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
                                        placeholder="Contoh: Sienna Brooks"
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
                                        Spesialisasi Potongan *
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
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
                                        Bio / Pengalaman
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
                                        placeholder="Keahlian, portofolio singkat..."
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
                                            Tema Kartu
                                        </label>
                                        <select
                                            value={editingBarber.card_theme || "charcoal"}
                                            onChange={(e) =>
                                                setEditingBarber({
                                                    ...editingBarber,
                                                    card_theme: e.target.value as BarberItem["card_theme"],
                                                })
                                            }
                                            className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-medium text-[#111110] focus:outline-none focus:border-[#111110]"
                                        >
                                            <option value="charcoal">Charcoal Dark (Default)</option>
                                            <option value="beige">Warm Beige</option>
                                            <option value="peach">Soft Peach</option>
                                            <option value="cream">Editorial Cream</option>
                                        </select>
                                    </div>

                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer mt-5">
                                        <input
                                            type="checkbox"
                                            checked={editingBarber.is_active ?? true}
                                            onChange={(e) =>
                                                setEditingBarber({
                                                    ...editingBarber,
                                                    is_active: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded accent-[#111110]"
                                        />
                                        <span>Aktif di Booking</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="pt-6 border-t border-[#E4E2DD] flex items-center justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={() => setEditingBarber(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                form="barber-form"
                                type="submit"
                                disabled={saving || uploadingPhoto}
                                className="px-4 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Stylist"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS BARBER */}
            {deletingBarber && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setDeletingBarber(null)}
                >
                    <div
                        className="max-w-sm w-full rounded-md bg-white text-[#111110] p-5 shadow-2xl border border-[#E4E2DD]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-[#111110]">
                            Hapus Profil &ldquo;{deletingBarber.name}&rdquo;?
                        </h3>
                        <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                            Barber ini tidak akan lagi muncul di halaman utama maupun pilihan booking baru, namun riwayat transaksi tetap aman.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingBarber(null)}
                                className="px-3 py-1.5 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={confirmDeleteBarber}
                                className="px-3.5 py-1.5 rounded-md bg-red-700 text-white text-xs font-medium hover:bg-red-800"
                            >
                                {saving ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}