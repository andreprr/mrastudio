"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceItem } from "@/types/database";
import { formatRupiah } from "@/config/site";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock, X, Sparkles } from "lucide-react";

export default function AdminServicesPage() {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State untuk Tambah / Edit Layanan
    const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(
        null
    );
    // Modal State untuk Konfirmasi Hapus
    const [deletingService, setDeletingService] = useState<ServiceItem | null>(
        null
    );
    const [saving, setSaving] = useState(false);

    const refreshServices = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("services")
            .select("*")
            .order("sort_order", { ascending: true });
        setServices((data as ServiceItem[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function initLoad() {
            const supabase = createClient();
            const { data } = await supabase
                .from("services")
                .select("*")
                .order("sort_order", { ascending: true });
            if (!ignore) {
                setServices((data as ServiceItem[]) || []);
                setLoading(false);
            }
        }
        initLoad();
        return () => {
            ignore = true;
        };
    }, []);

    async function handleSaveModal(e: React.FormEvent) {
        e.preventDefault();
        if (!editingService?.name) return;
        setSaving(true);

        const supabase = createClient();

        if (editingService.id) {
            // Mode Edit Layanan
            const { error } = await supabase
                .from("services")
                .update({
                    name: editingService.name,
                    price: Number(editingService.price || 0),
                    duration_minutes: Number(editingService.duration_minutes || 45),
                    description: editingService.description || null,
                    image_url: editingService.image_url || null,
                    is_active: editingService.is_active ?? true,
                    sort_order: Number(editingService.sort_order || 1),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", editingService.id);

            setSaving(false);
            if (error) {
                toast.error("Gagal memperbarui layanan.");
                return;
            }
            toast.success(`Layanan "${editingService.name}" berhasil diperbarui!`);
        } else {
            // Mode Tambah Baru
            const slug =
                editingService.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "") +
                "-" +
                Date.now().toString().slice(-4);

            const { error } = await supabase.from("services").insert({
                name: editingService.name,
                slug,
                price: Number(editingService.price || 0),
                duration_minutes: Number(editingService.duration_minutes || 45),
                description: editingService.description || null,
                image_url: editingService.image_url || null,
                is_active: editingService.is_active ?? true,
                sort_order: Number(editingService.sort_order || services.length + 1),
            });

            setSaving(false);
            if (error) {
                toast.error("Gagal menambah layanan: " + error.message);
                return;
            }
            toast.success("Layanan baru berhasil ditambahkan!");
        }

        setEditingService(null);
        await refreshServices();
    }

    async function confirmDelete() {
        if (!deletingService) return;
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from("services")
            .delete()
            .eq("id", deletingService.id);
        setSaving(false);

        if (error) {
            toast.error("Gagal menghapus layanan.");
            return;
        }
        toast.success(`Layanan "${deletingService.name}" telah dihapus.`);
        setDeletingService(null);
        await refreshServices();
    }

    return (
        <AdminShell>
            {/* Header & Tombol Buka Modal Tambah */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#141413]/10 mb-8">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#3B281E]">
                        Katalog & Pricelist
                    </span>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1">
                        Manajemen Layanan Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-[#706D65] mt-1">
                        Klik kartu layanan untuk mengedit harga atau durasi melalui jendela
                        modal.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setEditingService({
                            name: "",
                            price: 80000,
                            duration_minutes: 45,
                            description: "",
                            image_url: "",
                            is_active: true,
                            sort_order: services.length + 1,
                        })
                    }
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors shadow-md shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Layanan Baru</span>
                </button>
            </div>

            {/* Grid Kartu Layanan */}
            {loading ? (
                <p className="text-sm text-[#706D65]">Memuat katalog layanan...</p>
            ) : services.length === 0 ? (
                <div className="rounded-[2rem] bg-[#EAE4DC]/50 p-12 text-center">
                    <p className="font-display text-lg font-bold">
                        Belum ada layanan terdaftar.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((srv) => (
                        <div
                            key={srv.id}
                            className="rounded-[2rem] bg-[#EAE4DC]/70 border border-[#141413]/10 p-7 flex flex-col justify-between hover:bg-[#EAE4DC] transition-all shadow-sm"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${srv.is_active
                                                ? "bg-[#141413] text-[#DFC3B0]"
                                                : "bg-stone-300 text-stone-600"
                                            }`}
                                    >
                                        {srv.is_active ? "Aktif" : "Nonaktif"}
                                    </span>
                                    <span className="text-xs font-semibold text-[#706D65] flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {srv.duration_minutes} Menit
                                    </span>
                                </div>

                                <h3 className="font-display text-2xl font-extrabold text-[#141413]">
                                    {srv.name}
                                </h3>
                                <p className="text-xs text-[#706D65] mt-2 line-clamp-3 leading-relaxed">
                                    {srv.description || "Tanpa deskripsi tambahan."}
                                </p>
                            </div>

                            <div className="mt-8 pt-5 border-t border-[#141413]/10">
                                <span className="text-[10px] uppercase tracking-widest text-[#706D65] block">
                                    Harga Layanan
                                </span>
                                <p className="font-display text-2xl font-extrabold text-[#141413] mt-0.5">
                                    {formatRupiah(Number(srv.price))}
                                </p>

                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingService({ ...srv })}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E] transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Edit Harga / Info</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDeletingService(srv)}
                                        aria-label="Hapus layanan"
                                        className="p-2.5 rounded-full bg-red-500/10 text-red-800 hover:bg-red-600 hover:text-white transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM TAMBAH / EDIT LAYANAN */}
            {editingService && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setEditingService(null)}
                >
                    <div
                        className="relative max-w-lg w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-7 sm:p-9 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setEditingService(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#EAE4DC] flex items-center justify-center"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DFC3B0]/60 text-[#3B281E] text-[11px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                                {editingService.id ? "Edit Pricelist" : "Layanan Baru"}
                            </span>
                        </div>

                        <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-3">
                            {editingService.id
                                ? editingService.name
                                : "Tambah Paket Grooming"}
                        </h2>

                        <form onSubmit={handleSaveModal} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                    Nama Layanan *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editingService.name || ""}
                                    onChange={(e) =>
                                        setEditingService({
                                            ...editingService,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Premium 1"
                                    className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Harga (IDR) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={editingService.price ?? 0}
                                        onChange={(e) =>
                                            setEditingService({
                                                ...editingService,
                                                price: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Durasi (Menit) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={15}
                                        step={5}
                                        value={editingService.duration_minutes ?? 45}
                                        onChange={(e) =>
                                            setEditingService({
                                                ...editingService,
                                                duration_minutes: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                    Deskripsi Treatment
                                </label>
                                <textarea
                                    rows={3}
                                    value={editingService.description || ""}
                                    onChange={(e) =>
                                        setEditingService({
                                            ...editingService,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Contoh: Haircut + Shaving + Hairwash + Scrub + Hair Styling"
                                    className="w-full px-4 py-3 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-center pt-1">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3B281E] mb-1.5">
                                        Urutan Tampil
                                    </label>
                                    <input
                                        type="number"
                                        value={editingService.sort_order ?? 1}
                                        onChange={(e) =>
                                            setEditingService({
                                                ...editingService,
                                                sort_order: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm"
                                    />
                                </div>

                                <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer mt-5">
                                    <input
                                        type="checkbox"
                                        checked={editingService.is_active ?? true}
                                        onChange={(e) =>
                                            setEditingService({
                                                ...editingService,
                                                is_active: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 accent-[#141413]"
                                    />
                                    <span>Aktifkan di Booking</span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingService(null)}
                                    className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase tracking-wider"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-7 py-3 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-wider hover:bg-[#3B281E]"
                                >
                                    {saving ? "Menyimpan..." : "Simpan Layanan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingService && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingService(null)}
                >
                    <div
                        className="max-w-md w-full rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-8 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-display text-2xl font-extrabold">
                            Hapus Layanan &ldquo;{deletingService.name}&rdquo;?
                        </h3>
                        <p className="text-xs text-[#706D65] mt-2 leading-relaxed">
                            Layanan ini akan dihapus dari katalog publik, namun seluruh
                            riwayat transaksi booking lama tetap tersimpan secara aman.
                        </p>
                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingService(null)}
                                className="px-5 py-3 rounded-full border border-[#141413]/20 text-xs font-bold uppercase"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={confirmDelete}
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