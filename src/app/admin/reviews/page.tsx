"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReviewItem } from "@/types/database";
import { toast } from "sonner";
import {
    Plus,
    Trash2,
    Check,
    EyeOff,
    Star,
    Search,
    X,
    MessageSquare,
} from "lucide-react";

type FilterStatus = "all" | "pending" | "approved" | "hidden";

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Drawer state (Tambah ulasan manual)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [manualForm, setManualForm] = useState({
        customer_name: "",
        rating: 5,
        comment: "",
        status: "approved" as "pending" | "approved" | "hidden",
    });

    // Modal konfirmasi hapus
    const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchReviews = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Gagal memuat ulasan: " + error.message);
            setLoading(false);
            return;
        }

        setReviews((data as ReviewItem[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        let ignore = false;
        async function load() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("reviews")
                .select("*")
                .order("created_at", { ascending: false });

            if (ignore) return;
            if (error) {
                toast.error("Gagal memuat ulasan: " + error.message);
            } else {
                setReviews((data as ReviewItem[]) || []);
            }
            setLoading(false);
        }

        load();
        return () => {
            ignore = true;
        };
    }, []);

    // Metric Calculations
    const metrics = useMemo(() => {
        const total = reviews.length;
        const pending = reviews.filter((r) => r.status === "pending").length;
        const approved = reviews.filter((r) => r.status === "approved").length;
        const hidden = reviews.filter((r) => r.status === "hidden").length;
        const avg =
            total > 0
                ? reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / total
                : 5.0;

        return { total, pending, approved, hidden, avg };
    }, [reviews]);

    // Filtering
    const filteredReviews = useMemo(() => {
        return reviews.filter((r) => {
            const matchStatus =
                statusFilter === "all" || r.status === statusFilter;
            const matchQuery =
                !searchQuery.trim() ||
                r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.comment.toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchQuery;
        });
    }, [reviews, statusFilter, searchQuery]);

    // Quick Moderation Action: Set Status
    async function handleUpdateStatus(
        reviewId: string,
        nextStatus: "pending" | "approved" | "hidden"
    ) {
        const supabase = createClient();

        // Optimistic update
        setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, status: nextStatus } : r))
        );

        const { error } = await supabase
            .from("reviews")
            .update({ status: nextStatus })
            .eq("id", reviewId);

        if (error) {
            toast.error("Gagal memperbarui status ulasan: " + error.message);
            fetchReviews();
            return;
        }

        toast.success(
            nextStatus === "approved"
                ? "Ulasan disetujui dan tampil di halaman website."
                : nextStatus === "hidden"
                    ? "Ulasan disembunyikan dari publik."
                    : "Ulasan dipindahkan ke antrean moderasi."
        );
    }

    // Save manual review
    async function handleSaveManual(e: React.FormEvent) {
        e.preventDefault();
        if (!manualForm.customer_name.trim()) {
            toast.error("Nama pelanggan wajib diisi.");
            return;
        }
        if (!manualForm.comment.trim()) {
            toast.error("Komentar ulasan wajib diisi.");
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from("reviews").insert({
                customer_name: manualForm.customer_name.trim(),
                rating: manualForm.rating,
                comment: manualForm.comment.trim(),
                status: manualForm.status,
            });

            if (error) {
                toast.error("Gagal menyimpan ulasan: " + error.message);
                return;
            }

            toast.success("Ulasan pelanggan berhasil ditambahkan.");
            setDrawerOpen(false);
            setManualForm({
                customer_name: "",
                rating: 5,
                comment: "",
                status: "approved",
            });
            fetchReviews();
        } finally {
            setSaving(false);
        }
    }

    // Confirm delete review
    async function confirmDelete() {
        if (!deletingReview) return;
        setDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", deletingReview.id);

            if (error) {
                toast.error("Gagal menghapus ulasan: " + error.message);
                return;
            }

            toast.success("Ulasan berhasil dihapus.");
            setDeletingReview(null);
            fetchReviews();
        } finally {
            setDeleting(false);
        }
    }

    function formatReviewDate(dateStr: string) {
        try {
            return new Date(dateStr).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    }

    return (
        <AdminShell>
            {/* Header Architectural */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4E2DD] mb-6">
                <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                        Moderasi & Reputasi
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-[#111110] mt-1">
                        Ulasan & Rating Pelanggan
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-1">
                        Kelola transparansi testimoni pelanggan dan moderasi tampilan ulasan di landing page.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shadow-sm self-start sm:self-auto"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Ulasan Manual</span>
                </button>
            </div>

            {/* 1 Baris Architectural Metric Strip (Background Pure White) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 bg-[#FFFFFF] border border-[#E4E2DD] rounded-md divide-y lg:divide-y-0 lg:divide-x divide-[#E4E2DD] mb-6 overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FFFFFF]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                        TOTAL ULASAN
                    </span>
                    <div className="text-2xl font-bold font-mono tabular-nums text-[#111110] mt-1">
                        {metrics.total}
                    </div>
                    <span className="text-[11px] text-[#6E6D68] mt-0.5 block">
                        Seluruh database
                    </span>
                </div>

                <div className="p-4 bg-[#FFFFFF]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                        MENUNGGU MODERASI
                    </span>
                    <div
                        className={`text-2xl font-bold font-mono tabular-nums mt-1 ${metrics.pending > 0 ? "text-amber-600" : "text-[#111110]"
                            }`}
                    >
                        {metrics.pending}
                    </div>
                    <span className="text-[11px] text-[#6E6D68] mt-0.5 block">
                        Perlu peninjauan
                    </span>
                </div>

                <div className="p-4 bg-[#FFFFFF]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                        DISETUJUI (LIVE)
                    </span>
                    <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                        {metrics.approved}
                    </div>
                    <span className="text-[11px] text-[#6E6D68] mt-0.5 block">
                        Tampil di website
                    </span>
                </div>

                <div className="p-4 bg-[#FFFFFF]">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] block">
                        RATA-RATA RATING
                    </span>
                    <div className="text-2xl font-bold font-mono tabular-nums text-[#111110] mt-1 flex items-center gap-1.5">
                        <Star className="w-5 h-5 fill-[#C89D7C] text-[#C89D7C]" />
                        <span>{metrics.avg.toFixed(1)}</span>
                        <span className="text-xs font-normal text-[#6E6D68]">/ 5.0</span>
                    </div>
                    <span className="text-[11px] text-[#6E6D68] mt-0.5 block">
                        {metrics.hidden} disembunyikan
                    </span>
                </div>
            </div>

            {/* Filter Bar & Pencarian */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFFFF] p-2.5 border border-[#E4E2DD] rounded-md mb-4 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(
                        [
                            { key: "all", label: "Semua", count: metrics.total },
                            { key: "pending", label: "Menunggu", count: metrics.pending },
                            { key: "approved", label: "Disetujui", count: metrics.approved },
                            { key: "hidden", label: "Disembunyikan", count: metrics.hidden },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${statusFilter === tab.key
                                    ? "bg-[#111110] text-white shadow-sm"
                                    : "text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2]"
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded ${statusFilter === tab.key
                                        ? "bg-white/20 text-white"
                                        : "bg-[#F6F5F2] text-[#6E6D68]"
                                    }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-[#6E6D68] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari nama atau ulasan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#DCDAD4] text-xs text-[#111110] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#111110]"
                    />
                </div>
            </div>

            {/* High-Density Moderation Table */}
            {loading ? (
                <div className="bg-[#FFFFFF] border border-[#E4E2DD] rounded-md p-12 text-center text-xs text-[#6E6D68] shadow-sm">
                    Memuat data ulasan pelanggan...
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="bg-[#FFFFFF] border border-[#E4E2DD] rounded-md p-12 text-center shadow-sm">
                    <MessageSquare className="w-8 h-8 text-[#6E6D68] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#111110]">
                        Tidak ada ulasan yang sesuai
                    </p>
                    <p className="text-xs text-[#6E6D68] mt-1">
                        Coba sesuaikan filter status atau kata kunci pencarian Anda.
                    </p>
                </div>
            ) : (
                <div className="bg-[#FFFFFF] border border-[#E4E2DD] rounded-md overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#E4E2DD] bg-[#F6F5F2] text-[11px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                    <th className="px-4 py-2.5">Pelanggan & Tanggal</th>
                                    <th className="px-4 py-2.5">Rating</th>
                                    <th className="px-4 py-2.5">Komentar Ulasan</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5 text-right">Aksi Moderasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E2DD] text-xs">
                                {filteredReviews.map((r) => (
                                    <tr key={r.id} className="hover:bg-[#FAFAF9] transition-colors">
                                        {/* Pelanggan & Tanggal */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="font-semibold text-sm text-[#111110]">
                                                {r.customer_name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 font-mono tabular-nums text-[11px] text-[#6E6D68]">
                                                <span>{formatReviewDate(r.created_at)}</span>
                                            </div>
                                        </td>

                                        {/* Rating */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3.5 h-3.5 ${i < r.rating
                                                                    ? "fill-[#C89D7C] text-[#C89D7C]"
                                                                    : "text-[#DCDAD4]"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="font-mono tabular-nums font-semibold text-xs text-[#111110] ml-1">
                                                    {r.rating}/5
                                                </span>
                                            </div>
                                        </td>

                                        {/* Komentar Ulasan */}
                                        <td className="px-4 py-3">
                                            <p className="text-xs text-[#111110] leading-relaxed max-w-md line-clamp-3">
                                                &ldquo;{r.comment}&rdquo;
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${r.status === "approved"
                                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                        : r.status === "pending"
                                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                                            : "bg-[#F6F5F2] text-[#6E6D68] border-[#E4E2DD]"
                                                    }`}
                                            >
                                                <span
                                                    className={`w-1.5 h-1.5 rounded-full ${r.status === "approved"
                                                            ? "bg-emerald-500"
                                                            : r.status === "pending"
                                                                ? "bg-amber-500"
                                                                : "bg-stone-400"
                                                        }`}
                                                />
                                                <span>
                                                    {r.status === "approved"
                                                        ? "Disetujui"
                                                        : r.status === "pending"
                                                            ? "Menunggu"
                                                            : "Disembunyikan"}
                                                </span>
                                            </span>
                                        </td>

                                        {/* Aksi Moderasi Cepat */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {r.status !== "approved" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(r.id, "approved")}
                                                        className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        <span>Setujui</span>
                                                    </button>
                                                )}

                                                {r.status !== "hidden" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(r.id, "hidden")}
                                                        className="px-2.5 py-1 rounded-md bg-[#FFFFFF] border border-[#E4E2DD] text-[#6E6D68] text-xs font-medium hover:bg-[#F6F5F2] hover:text-[#111110] transition-colors flex items-center gap-1"
                                                    >
                                                        <EyeOff className="w-3 h-3" />
                                                        <span>Sembunyikan</span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setDeletingReview(r)}
                                                    className="p-1 rounded-md border border-[#E4E2DD] text-[#6E6D68] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                                                    title="Hapus ulasan"
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

            {/* RIGHT SLIDE-OVER DRAWER (TAMBAH ULASAN MANUAL) */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FFFFFF] border-l border-[#E4E2DD] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
                        <div>
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-[#E4E2DD]">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6D68]">
                                        Testimonial Desk
                                    </span>
                                    <h2 className="text-base font-bold text-[#111110] mt-0.5">
                                        Tambah Ulasan Manual
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setDrawerOpen(false)}
                                    className="p-1.5 rounded-md text-[#6E6D68] hover:text-[#111110] hover:bg-[#F6F5F2] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form Input */}
                            <form id="review-drawer-form" onSubmit={handleSaveManual} className="mt-5 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Nama Pelanggan *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Dimas Prasetyo"
                                        value={manualForm.customer_name}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                customer_name: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1.5">
                                        Rating Bintang
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() =>
                                                    setManualForm({ ...manualForm, rating: star })
                                                }
                                                className="p-1 rounded hover:bg-[#F6F5F2] transition-colors"
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${star <= manualForm.rating
                                                            ? "fill-[#C89D7C] text-[#C89D7C]"
                                                            : "text-[#DCDAD4]"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                        <span className="font-mono tabular-nums text-xs font-semibold text-[#111110] ml-2">
                                            {manualForm.rating} dari 5
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Status Moderasi Awal
                                    </label>
                                    <select
                                        value={manualForm.status}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                status: e.target.value as "pending" | "approved" | "hidden",
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110]"
                                    >
                                        <option value="approved">Disetujui (Langsung Live)</option>
                                        <option value="pending">Menunggu Moderasi</option>
                                        <option value="hidden">Disembunyikan (Arsip Internal)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1">
                                        Komentar / Testimoni *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Tulis ulasan pelanggan mengenai hasil potongan rambut, keramahan barber, atau kenyamanan studio..."
                                        value={manualForm.comment}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                comment: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 rounded-md bg-[#FFFFFF] border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] leading-relaxed"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Drawer Footer */}
                        <div className="pt-4 border-t border-[#E4E2DD] flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2] transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="review-drawer-form"
                                disabled={saving}
                                className="px-3.5 py-2 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Menyimpan..." : "Simpan Ulasan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KONFIRMASI HAPUS */}
            {deletingReview && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setDeletingReview(null)}
                >
                    <div
                        className="rounded-md border border-[#E4E2DD] bg-[#FFFFFF] p-6 max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-[#111110]">
                            Hapus Ulasan Pelanggan?
                        </h3>
                        <p className="text-xs text-[#6E6D68] mt-2 leading-relaxed">
                            Ulasan dari &quot;<strong>{deletingReview.customer_name}</strong>&quot; akan dihapus permanen dari sistem database.
                        </p>
                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeletingReview(null)}
                                className="px-3.5 py-2 rounded-md bg-[#FFFFFF] border border-[#E4E2DD] text-[#111110] text-xs font-medium hover:bg-[#F6F5F2]"
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