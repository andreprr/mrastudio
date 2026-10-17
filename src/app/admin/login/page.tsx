"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Lock, Loader2, ArrowLeft, Scissors } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error("Email atau kata sandi admin tidak valid.");
            setLoading(false);
            return;
        }

        toast.success("Selamat datang di Portal Admin MR A Studio.");
        router.push("/admin");
        router.refresh();
    }

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#141413]">
            {/* Latar Belakang Editorial Full-Bleed */}
            <img
                src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=80"
                alt="MR A Studio Interior"
                className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141413] via-[#141413]/80 to-[#141413]/60" />

            <div className="relative z-10 max-w-md w-full">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#DFC3B0] hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                </Link>

                <div className="rounded-[2.5rem] bg-[#F8F6F1] text-[#141413] p-8 sm:p-11 shadow-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-[#141413] text-[#DFC3B0] flex items-center justify-center shadow-md">
                            <Scissors className="w-5 h-5" />
                        </div>
                        <span className="px-3.5 py-1 rounded-full bg-[#EAE4DC] text-[#3B281E] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            <span>Admin Access</span>
                        </span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413]">
                        MR A Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-[#706D65] mt-2 leading-relaxed">
                        Masuk menggunakan kredensial administrator untuk mengelola jadwal
                        reservasi, katalog harga, dan tim studio.
                    </p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#3B281E] mb-2">
                                Email Administrator
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="admin@mrastudio.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-2xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-medium focus:outline-none focus:border-[#141413] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#3B281E] mb-2">
                                Kata Sandi
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-2xl bg-[#EAE4DC]/70 border border-[#141413]/15 text-sm font-medium focus:outline-none focus:border-[#141413] transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-full bg-[#141413] text-[#F8F6F1] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3B281E] transition-all shadow-lg disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}