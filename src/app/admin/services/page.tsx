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
            {/* Header & Tombol Tambah Layanan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E2DD] mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl font-bold text-[#111110]">
                        Manajemen Layanan & Pricelist
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-0.5">
                        Kelola katalog layanan, durasi penanganan, dan harga paket studio.
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Layanan</span>
                </button>
            </div>

            {/* Tabel Pricelist Presisi */}
            {loading ? (
                <div className="py-16 text-center text-xs text-[#6E6D68] bg-white border border-[#E4E2DD] rounded-md">
                    Memuat katalog layanan...
                </div>
            ) : services.length === 0 ? (
                <div className="bg-white border border-[#E4E2DD] rounded-md p-8 text-center">
                    <p className="text-sm font-semibold text-[#111110]">Belum ada layanan terdaftar.</p>
                </div>
            ) : (
                <div className="bg-white border border-[#E4E2DD] rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-[#E4E2DD] bg-[#F6F5F2]/70 text-[#6E6D68] uppercase text-[10px] tracking-wider font-semibold">
                                    <th className="py-2.5 px-4 w-16">URUTAN</th>
                                    <th className="py-2.5 px-4">NAMA & DESKRIPSI</th>
                                    <th className="py-2.5 px-4 w-28">DURASI</th>
                                    <th className="py-2.5 px-4 w-36">HARGA</th>
                                    <th className="py-2.5 px-4 w-28">STATUS</th>
                                    <th className="py-2.5 px-4 w-28 text-right">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E2DD]">
                                {services.map((srv) => (
                                    <tr key={srv.id} className="hover:bg-[#F6F5F2]/50 transition-colors">
                                        <td className="py-3 px-4 font-mono font-medium text-[#6E6D68]">
                                            #{srv.sort_order}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-[#111110]">{srv.name}</div>
                                            {srv.description && (
                                                <div className="text-[11px] text-[#6E6D68] mt-0.5 line-clamp-1 max-w-md">
                                                    {srv.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 font-mono tabular-nums text-[#6E6D68]">
                                            {srv.duration_minutes} mnt
                                        </td>
                                        <td className="py-3 px-4 font-mono tabular-nums font-semibold text-[#111110]">
                                            {formatRupiah(Number(srv.price))}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                    srv.is_active
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                        : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${srv.is_active ? "bg-emerald-500" : "bg-zinc-400"}`} />
                                                {srv.is_active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingService({ ...srv })}
                                                    className="p-1.5 rounded-md hover:bg-[#F6F5F2] text-[#6E6D68] hover:text-[#111110] transition-colors"
                                                    title="Edit layanan"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingService(srv)}
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-[#6E6D68] hover:text-red-700 transition-colors"
                                                    title="Hapus layanan"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SLIDE-OVER DRAWER FORM TAMBAH / EDIT LAYANAN */}
            {editingService && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
                    onClick={() => setEditingService(null)}
                >
                    <div
                        className="w-full max-w-md bg-white border-l border-[#E4E2DD] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DD]">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C89D7C] block">
                                        Pricelist Management
                                    </span>
                                    <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                        {editingService.id ? "Edit Layanan" : "Tambah Layanan Baru"}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingService(null)}
                                    className="p-1.5 rounded-md hover:bg-[#F6F5F2] text-[#6E6D68] hover:text-[#111110]"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form id="service-form" onSubmit={handleSaveModal} className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
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
                                        placeholder="Contoh: Classic Cut & Wash"
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
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
                                            className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
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
                                            className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
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
                                        placeholder="Detail tahapan layanan..."
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                                    <div>
                                        <label className="block text-[11px] font-medium text-[#6E6D68] mb-1">
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
                                            className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                        />
                                    </div>

                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer mt-5">
                                        <input
                                            type="checkbox"
                                            checked={editingService.is_active ?? true}
                                            onChange={(e) =>
                                                setEditingService({
                                                    ...editingService,
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
                                onClick={() => setEditingService(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                form="service-form"
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Layanan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingService && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setDeletingService(null)}
                >
                    <div
                        className="max-w-sm w-full rounded-md bg-white text-[#111110] p-5 shadow-2xl border border-[#E4E2DD]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-[#111110]">
                            Hapus Layanan &ldquo;{deletingService.name}&rdquo;?
                        </h3>
                        <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                            Layanan ini akan dihapus dari katalog publik, namun seluruh
                            riwayat transaksi booking lama tetap tersimpan.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingService(null)}
                                className="px-3 py-1.5 rounded-md bg-white border border-[#E4E2DD] text-xs font-medium text-[#111110] hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={confirmDelete}
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