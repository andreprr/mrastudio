"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { GalleryItem } from "@/types/database";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    Edit2,
    Eye,
    EyeOff,
    X,
    Upload,
    Loader2,
    ImageIcon,
    Filter,
} from "lucide-react";

const isVideoUrl = (url?: string | null) =>
    !!url && /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

const CATEGORIES = ["Semua", "Haircut", "Styling", "Beard", "Studio"] as const;

export default function AdminGalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string>("Semua");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

    // Drawer state
    const [drawerItem, setDrawerItem] = useState<Partial<GalleryItem> | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Modal konfirmasi hapus
    const [deletingItem, setDeletingItem] = useState<GalleryItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchGallery = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("gallery_items")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Gagal memuat item galeri: " + error.message);
            setLoading(false);
            return;
        }

        setItems((data as GalleryItem[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function load() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("gallery_items")
                .select("*")
                .order("sort_order", { ascending: true })
                .order("created_at", { ascending: false });

            if (ignore) return;
            if (error) {
                toast.error("Gagal memuat item galeri: " + error.message);
            } else {
                setItems((data as GalleryItem[]) || []);
            }
            setLoading(false);
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    // Filter logic
    const filteredItems = items.filter((item) => {
        const matchCategory =
            categoryFilter === "Semua" ||
            item.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && item.is_published) ||
            (statusFilter === "draft" && !item.is_published);
        return matchCategory && matchStatus;
    });

    // Handle upload foto ke Supabase Storage
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi tipe & ukuran (maks 25MB video, 5MB foto)
        const validTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
        if (!validTypes.includes(file.type)) {
            toast.error("Format file tidak didukung. Gunakan JPEG, PNG, WebP, MP4, WebM, atau MOV.");
            return;
        }

        const maxSize = file.type.startsWith("video/") ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`Ukuran file melebihi batas maksimal ${file.type.startsWith("video/") ? "25MB" : "5MB"}.`);
            return;
        }

        setUploadingImage(true);
        try {
            const supabase = createClient();
            const ext = file.name.split(".").pop() || "jpg";
            const filePath = `gallery/item-${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("studio-assets")
                .upload(filePath, file, { cacheControl: "3600", upsert: true });

            if (uploadError) {
                toast.error("Gagal mengunggah foto: " + uploadError.message);
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("studio-assets").getPublicUrl(filePath);

            setDrawerItem((prev) => ({
                ...prev,
                image_url: publicUrl,
            }));
            toast.success("Foto berhasil diunggah.");
        } finally {
            setUploadingImage(false);
        }
    }

    // Toggle publish status langsung
    async function handleTogglePublish(item: GalleryItem) {
        const supabase = createClient();
        const nextStatus = !item.is_published;

        // Optimistic update
        setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, is_published: nextStatus } : i))
        );

        const { error } = await supabase
            .from("gallery_items")
            .update({ is_published: nextStatus })
            .eq("id", item.id);

        if (error) {
            toast.error("Gagal mengubah status: " + error.message);
            fetchGallery();
            return;
        }

        toast.success(
            nextStatus
                ? `Foto "${item.title}" sekarang dipublikasikan.`
                : `Foto "${item.title}" disimpan sebagai draft.`
        );
    }

    // Simpan data dari drawer
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!drawerItem?.title?.trim()) {
            toast.error("Judul foto wajib diisi.");
            return;
        }
        if (!drawerItem?.image_url?.trim()) {
            toast.error("Foto wajib diunggah atau isi URL gambar.");
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const payload = {
                title: drawerItem.title.trim(),
                category: drawerItem.category || "Haircut",
                aspect_ratio: drawerItem.aspect_ratio || "portrait",
                image_url: drawerItem.image_url.trim(),
                sort_order: Number(drawerItem.sort_order) || 0,
                description: drawerItem.description?.trim() || null,
                is_published: drawerItem.is_published ?? true,
            };

            if (drawerItem.id) {
                // Update
                const { error } = await supabase
                    .from("gallery_items")
                    .update(payload)
                    .eq("id", drawerItem.id);

                if (error) {
                    toast.error("Gagal memperbarui item galeri: " + error.message);
                    return;
                }
                toast.success("Item galeri berhasil diperbarui.");
            } else {
                // Insert
                const { error } = await supabase
                    .from("gallery_items")
                    .insert(payload);

                if (error) {
                    toast.error("Gagal menambahkan item galeri: " + error.message);
                    return;
                }
                toast.success("Foto baru berhasil ditambahkan ke galeri.");
            }

            setDrawerItem(null);
            fetchGallery();
        } finally {
            setSaving(false);
        }
    }

    // Konfirmasi hapus
    async function confirmDelete() {
        if (!deletingItem) return;
        setDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("gallery_items")
                .delete()
                .eq("id", deletingItem.id);

            if (error) {
                toast.error("Gagal menghapus item: " + error.message);
                return;
            }

            toast.success(`Foto "${deletingItem.title}" berhasil dihapus.`);
            setDeletingItem(null);
            fetchGallery();
        } finally {
            setDeleting(false);
        }
    }

    return (
        <AdminShell>
            {/* Header Architectural */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DD] mb-6">
                <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                        Manajemen Konten & Portofolio
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111110] mt-1">
                        Galeri & Lookbook
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-1">
                        Katalog visual potongan rambut dan estetika studio untuk inspirasi pelanggan.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setDrawerItem({
                            title: "",
                            category: "Haircut",
                            aspect_ratio: "portrait",
                            image_url: "",
                            sort_order: items.length + 1,
                            description: "",
                            is_published: true,
                        })
                    }
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shadow-sm self-start sm:self-auto"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Konten</span>
                </button>
            </div>

            {/* Filter Bar Padat */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 border border-[#E4E2DD] rounded-md mb-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-[#6E6D68] shrink-0 ml-1 mr-1" />
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${categoryFilter === cat
                                    ? "bg-[#111110] text-white shadow-sm"
                                    : "text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2]"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E4E2DD]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mr-1">
                        Status:
                    </span>
                    {(["all", "published", "draft"] as const).map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${statusFilter === st
                                    ? "bg-[#111110] text-white border-[#111110]"
                                    : "bg-white text-[#6E6D68] border-[#E4E2DD] hover:bg-[#F6F5F2]"
                                }`}
                        >
                            {st === "all" ? "Semua" : st === "published" ? "Live" : "Draft"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Architectural Media Table */}
            {loading ? (
                <div className="bg-white border border-[#E4E2DD] rounded-md p-12 text-center text-xs text-[#6E6D68]">
                    Memuat katalog foto galeri...
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white border border-[#E4E2DD] rounded-md p-12 text-center">
                    <ImageIcon className="w-8 h-8 text-[#6E6D68] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#111110]">
                        Tidak ada item galeri yang sesuai filter
                    </p>
                    <p className="text-xs text-[#6E6D68] mt-1">
                        Klik &quot;Tambah Foto&quot; untuk mengunggah karya potong rambut studio.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-[#E4E2DD] rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E4E2DD] bg-[#F6F5F2] text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                    <th className="px-4 py-2.5">Media & Judul</th>
                                    <th className="px-4 py-2.5">Kategori & Rasio</th>
                                    <th className="px-4 py-2.5">Urutan</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E2DD] text-xs">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-[#FAFAF9] transition-colors">
                                        {/* Media & Judul */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    {isVideoUrl(item.image_url) ? (
                                                        <video
                                                            src={item.image_url}
                                                            muted
                                                            loop
                                                            autoPlay
                                                            playsInline
                                                            className="w-14 h-14 rounded object-cover bg-[#111110] border border-[#E4E2DD]"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.title}
                                                            className="w-14 h-14 rounded object-cover bg-[#F6F5F2] border border-[#E4E2DD]"
                                                        />
                                                    )}
                                                    {isVideoUrl(item.image_url) && (
                                                        <span className="absolute -top-1 -right-1 px-1 py-px rounded text-[8px] font-mono font-bold uppercase bg-red-600 text-white leading-none">
                                                            VID
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-sm text-[#111110] truncate max-w-xs sm:max-w-md">
                                                        {item.title}
                                                    </h3>
                                                    {item.description ? (
                                                        <p className="text-xs text-[#6E6D68] truncate max-w-xs mt-0.5">
                                                            {item.description}
                                                        </p>
                                                    ) : (
                                                        <span className="text-[11px] text-[#6E6D68]/60 italic">
                                                            Tanpa deskripsi
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Kategori & Rasio */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded text-[11px] font-medium border border-[#E4E2DD] bg-[#F6F5F2] text-[#111110]">
                                                    {item.category}
                                                </span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-[#6E6D68] bg-[#F6F5F2] border border-[#E4E2DD]">
                                                    {item.aspect_ratio || "portrait"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Urutan */}
                                        <td className="px-4 py-3 font-mono tabular-nums text-[#111110]">
                                            #{item.sort_order ?? 0}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleTogglePublish(item)}
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${item.is_published
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                                        : "bg-[#F6F5F2] text-[#6E6D68] border-[#E4E2DD] hover:bg-[#EAE4DC]"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${item.is_published ? "bg-emerald-500" : "bg-stone-400"
                                                        }`}
                                                />
                                                <span>{item.is_published ? "Published" : "Draft"}</span>
                                            </button>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePublish(item)}
                                                    className="p-1.5 rounded-md border border-[#E4E2DD] text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2] transition-colors"
                                                    title={item.is_published ? "Ubah ke Draft" : "Publikasikan"}
                                                >
                                                    {item.is_published ? (
                                                        <EyeOff className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDrawerItem({ ...item })}
                                                    className="px-2.5 py-1 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors flex items-center gap-1"
                                                >
                                                    <Edit2 className="w-3 h-3 text-[#6E6D68]" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingItem(item)}
                                                    className="p-1.5 rounded-md border border-[#E4E2DD] text-[#6E6D68] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                    title="Hapus foto"
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

            {/* RIGHT SLIDE-OVER DRAWER (TAMBAH / EDIT GALERI) */}
            {drawerItem && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setDrawerItem(null)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-[#E4E2DD] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DD]">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                        Lookbook Curator
                                    </span>
                                    <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                        {drawerItem.id ? "Edit Item Galeri" : "Tambah Foto Galeri"}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrawerItem(null)}
                                    className="p-1.5 rounded-md text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form Input */}
                            <form id="gallery-drawer-form" onSubmit={handleSave} className="mt-5 space-y-4">
                                {/* Upload Foto / Video */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1.5">
                                        Media * (Foto maks 5MB, Video maks 25MB)
                                    </label>

                                    {drawerItem.image_url ? (
                                        <div className="flex items-start gap-3 p-3 bg-[#F6F5F2] border border-[#E4E2DD] rounded-md mb-2">
                                            {isVideoUrl(drawerItem.image_url) ? (
                                                <video
                                                    src={drawerItem.image_url}
                                                    muted
                                                    loop
                                                    autoPlay
                                                    playsInline
                                                    className="w-20 h-20 rounded-md object-cover border border-[#E4E2DD] bg-[#111110] shrink-0"
                                                />
                                            ) : (
                                                <img
                                                    src={drawerItem.image_url}
                                                    alt="Preview"
                                                    className="w-20 h-20 rounded-md object-cover border border-[#E4E2DD] bg-white shrink-0"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-medium text-[#111110] block truncate">
                                                    {isVideoUrl(drawerItem.image_url) ? "Video Terpilih" : "Foto Terpilih"}
                                                </span>
                                                <p className="text-[11px] text-[#6E6D68] truncate mt-0.5">
                                                    {drawerItem.image_url}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDrawerItem({ ...drawerItem, image_url: "" })
                                                    }
                                                    className="mt-2 text-[11px] text-red-600 hover:underline font-medium"
                                                >
                                                    Ganti Media
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#DCDAD4] rounded-md hover:border-[#111110] transition-colors cursor-pointer bg-[#F6F5F2]/50">
                                            {uploadingImage ? (
                                                <div className="flex items-center gap-2 text-xs font-medium text-[#111110]">
                                                    <Loader2 className="w-4 h-4 animate-spin text-[#111110]" />
                                                    <span>Mengunggah ke storage...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-[#6E6D68] mb-1.5" />
                                                    <span className="text-xs font-medium text-[#111110]">
                                                        Pilih File Foto atau Video
                                                    </span>
                                                    <span className="text-[10px] text-[#6E6D68] mt-0.5">
                                                        JPEG, PNG, WebP, MP4, WebM, MOV
                                                    </span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                                                disabled={uploadingImage}
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}

                                    {/* Alternatif Input URL */}
                                    <div className="mt-2">
                                        <input
                                            type="url"
                                            placeholder="Atau tempel URL gambar eksternal (https://...)"
                                            value={drawerItem.image_url || ""}
                                            onChange={(e) =>
                                                setDrawerItem({ ...drawerItem, image_url: e.target.value })
                                            }
                                            className="w-full px-3 py-1.5 rounded-md bg-white border border-[#DCDAD4] text-xs text-[#111110] focus:outline-none focus:border-[#111110]"
                                        />
                                    </div>
                                </div>

                                {/* Judul */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Judul Foto *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Classic French Crop / Taper Fade"
                                        value={drawerItem.title || ""}
                                        onChange={(e) =>
                                            setDrawerItem({ ...drawerItem, title: e.target.value })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                {/* Kategori & Rasio */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                            Kategori
                                        </label>
                                        <select
                                            value={drawerItem.category || "Haircut"}
                                            onChange={(e) =>
                                                setDrawerItem({ ...drawerItem, category: e.target.value })
                                            }
                                            className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                        >
                                            <option value="Haircut">Haircut</option>
                                            <option value="Styling">Styling</option>
                                            <option value="Beard">Beard</option>
                                            <option value="Studio">Studio</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                            Orientasi Rasio
                                        </label>
                                        <select
                                            value={drawerItem.aspect_ratio || "portrait"}
                                            onChange={(e) =>
                                                setDrawerItem({
                                                    ...drawerItem,
                                                    aspect_ratio: e.target.value as "portrait" | "square" | "landscape",
                                                })
                                            }
                                            className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                        >
                                            <option value="portrait">Portrait (4:5)</option>
                                            <option value="square">Square (1:1)</option>
                                            <option value="landscape">Landscape (16:9)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Urutan Tampil */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Urutan Tampilan (Angka Rendah di Awal)
                                    </label>
                                    <input
                                        type="number"
                                        value={drawerItem.sort_order ?? 0}
                                        onChange={(e) =>
                                            setDrawerItem({
                                                ...drawerItem,
                                                sort_order: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm font-mono tabular-nums text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                {/* Deskripsi */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Deskripsi Singkat (Opsional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Catatan teknik potongan, produk yang digunakan, atau detail gaya..."
                                        value={drawerItem.description || ""}
                                        onChange={(e) =>
                                            setDrawerItem({
                                                ...drawerItem,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] leading-relaxed"
                                    />
                                </div>

                                {/* Checkbox Published */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={drawerItem.is_published ?? true}
                                            onChange={(e) =>
                                                setDrawerItem({
                                                    ...drawerItem,
                                                    is_published: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded text-[#111110] border-[#DCDAD4] focus:ring-[#111110]"
                                        />
                                        <span className="text-xs font-medium text-[#111110]">
                                            Publikasikan langsung ke halaman landing
                                        </span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Drawer Footer */}
                        <div className="pt-4 border-t border-[#E4E2DD] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDrawerItem(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="gallery-drawer-form"
                                disabled={saving || uploadingImage}
                                className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Foto"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingItem && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingItem(null)}
                >
                    <div
                        className="rounded-md border border-[#E4E2DD] bg-white p-6 max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-[#111110]">
                            Hapus Foto Galeri?
                        </h3>
                        <p className="text-xs text-[#6E6D68] mt-2 leading-relaxed">
                            Foto &quot;<strong>{deletingItem.title}</strong>&quot; akan dihapus permanen dari portofolio lookbook.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingItem(null)}
                                className="px-3.5 py-2 rounded-md bg-white border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2]"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDelete}
                                className="px-3.5 py-2 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700"
                            >
                                {deleting ? "Menghapus..." : "Ya, Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
