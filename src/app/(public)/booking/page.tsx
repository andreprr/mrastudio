import { createServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_SITE_SETTINGS } from "@/config/site";
import { Navbar } from "@/components/layout/Navbar";
import { BookingWizard } from "@/components/booking/BookingWizard";


export default async function BookingPage({
    searchParams,
}: {
    searchParams: Promise<{ serviceId?: string; barberId?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createServerSupabase();

    const [
        { data: settingRow },
        { data: services },
        { data: barbers },
        { data: businessHours },
    ] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "general").single(),
        supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        supabase
            .from("barbers")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: true }),
        supabase
            .from("business_hours")
            .select("*")
            .order("day_of_week", { ascending: true }),
    ]);

    const settings = {
        ...DEFAULT_SITE_SETTINGS,
        ...(settingRow?.value || {}),
    };

    return (
        <div className="min-h-screen bg-brand-cream">
            <Navbar brandName={settings.brand_name} />
            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <div className="mb-10 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-brand-espresso">
                        Reservasi Online
                    </span>
                    <h1 className="font-display text-3xl sm:text-5xl font-bold text-brand-charcoal mt-2">
                        Jadwalkan Sesi Anda
                    </h1>
                </div>

                <BookingWizard
                    services={services || []}
                    barbers={barbers || []}
                    businessHours={businessHours || []}
                    settings={settings}
                    initialServiceId={params.serviceId}
                    initialBarberId={params.barberId}
                />
            </main>
        </div>
    );
}