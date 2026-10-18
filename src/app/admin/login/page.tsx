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
                    className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#C89D7C] hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Beranda</span>
                </Link>

                <div className="rounded-md bg-white text-[#111110] p-6 sm:p-8 shadow-2xl border border-[#E4E2DD]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-10 h-10 rounded-md bg-[#111110] text-[#C89D7C] flex items-center justify-center shadow-sm">
                            <Scissors className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider bg-[#F6F5F2] border border-[#E4E2DD] text-[#6E6D68] flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-[#111110]" />
                            <span>Admin Access</span>
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-[#111110]">
                        MR A Studio
                    </h1>
                    <p className="text-xs text-[#6E6D68] mt-1.5 leading-relaxed">
                        Masuk menggunakan kredensial administrator untuk mengelola jadwal
                        reservasi, katalog harga, dan tim studio.
                    </p>

                    <form onSubmit={handleLogin} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1.5">
                                Email Administrator
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="admin@mrastudio.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6E6D68] mb-1.5">
                                Kata Sandi
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded-md bg-white border border-[#DCDAD4] text-xs sm:text-sm text-[#111110] focus:outline-none focus:border-[#111110] transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-md bg-[#111110] text-white text-xs font-medium hover:bg-[#2A2A28] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-2"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{loading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}