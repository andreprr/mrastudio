export default function Loading() {
    return (
        <div className="min-h-screen bg-[#F8F6F1]">
            {/* Skeleton Navbar */}
            <div className="h-16 border-b border-[#141413]/10 px-6 flex items-center justify-between">
                <div className="h-6 w-32 bg-[#141413]/10 rounded-md animate-pulse" />
                <div className="hidden sm:flex items-center gap-4">
                    <div className="h-4 w-16 bg-[#141413]/10 rounded-md animate-pulse" />
                    <div className="h-4 w-16 bg-[#141413]/10 rounded-md animate-pulse" />
                    <div className="h-4 w-16 bg-[#141413]/10 rounded-md animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-[#141413]/10 rounded-full animate-pulse" />
            </div>

            {/* Skeleton Hero Banner */}
            <div className="h-[70vh] w-full bg-[#141413]/90 animate-pulse flex flex-col items-center justify-center gap-4 px-4">
                <div className="h-10 w-64 sm:w-96 bg-white/10 rounded-md" />
                <div className="h-5 w-48 sm:w-72 bg-white/10 rounded-md" />
                <div className="h-10 w-36 bg-white/10 rounded-md mt-2" />
            </div>

            {/* Skeleton Grid Section */}
            <div className="max-w-6xl mx-auto py-12 px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="aspect-[4/5] rounded-lg bg-[#EAE4DC] animate-pulse" />
                <div className="aspect-[4/5] rounded-lg bg-[#EAE4DC] animate-pulse" />
                <div className="aspect-[4/5] rounded-lg bg-[#EAE4DC] animate-pulse" />
                <div className="aspect-[4/5] rounded-lg bg-[#EAE4DC] animate-pulse" />
            </div>
        </div>
    );
}
