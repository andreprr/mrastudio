import { MapPin, Navigation, Sparkles } from "lucide-react";

interface MapsProps {
    brandName?: string;
    address?: string;
}

export function MapsSection({
    brandName = "Mister A Studio",
    address = "Mister A Studio — Lihat lokasi lengkap dan rute tercepat melalui peta interaktif di bawah ini.",
}: MapsProps) {
    return (
        <div className="w-full">
            {/* Header Section Maps */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#dd3e1f]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Lokasi & Navigasi</span>
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#141413] mt-1.5">
                        Kunjungi Studio Kami
                    </h2>
                </div>

                <a
                    href="https://maps.google.com/?q=Mister+A+Studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#dd3e1f] text-white border-2 border-[#141413] font-bold text-xs hover:bg-[#141413] transition-colors shadow-[2px_2px_0px_#141413] self-start sm:self-auto"
                >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Buka di Aplikasi Maps</span>
                </a>
            </div>

            {/* Frame Peta Responsif (Mobile, Tablet, Desktop) */}
            <div className="rounded-2xl bg-[#EAE4DC]/70 p-2.5 sm:p-3.5 border-2 border-[#141413] shadow-[4px_4px_0px_#141413]">
                {/* Top Bar Editorial */}
                <div className="flex items-center justify-between px-2 pb-2.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-[#141413]">
                    <div className="flex items-center gap-2 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#dd3e1f] animate-pulse" />
                        <span>{brandName} • OFFICIAL LOCATION</span>
                    </div>
                    <span className="text-[#706D65] hidden sm:inline">
                        3°32&apos;03.4&quot;N 98°41&apos;20.2&quot;E
                    </span>
                </div>

                {/* Container Iframe Responsif */}
                <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[440px] rounded-xl overflow-hidden bg-[#141413] border-2 border-[#141413]">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3982.2301202607855!2d98.68895287520185!3d3.534266650664097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30313b7e1ee8b539%3A0xf7645272652276ee!2sMister%20A%20Studio!5e0!3m2!1sid!2sid!4v1792828414497!5m2!1sid!2sid"
                        title={`Peta Lokasi ${brandName}`}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>

                {/* Bottom Bar Informasi Alamat */}
                <div className="pt-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#141413]">
                    <div className="flex items-start sm:items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#dd3e1f] shrink-0 mt-0.5 sm:mt-0" />
                        <span className="font-medium leading-snug">{address}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#706D65] shrink-0">
                        Parkir Tersedia &bull; Akses Mudah
                    </span>
                </div>
            </div>
        </div>
    );
}

export default MapsSection;