export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-[#F6F5F2] p-6 lg:p-8">
            {/* Header placeholder */}
            <div className="flex items-center justify-between mb-6 animate-pulse">
                <div>
                    <div className="h-6 w-48 bg-[#E4E2DD] rounded" />
                    <div className="h-3.5 w-64 bg-[#E4E2DD]/70 rounded mt-2" />
                </div>
                <div className="h-9 w-28 bg-[#E4E2DD] rounded" />
            </div>

            {/* Skeleton Metric Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-5 bg-white border border-[#E4E2DD] rounded-md divide-x divide-[#E4E2DD] h-20 mb-6 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3.5 flex flex-col justify-center">
                        <div className="h-3 w-16 bg-[#E4E2DD] rounded mb-2" />
                        <div className="h-5 w-12 bg-[#E4E2DD] rounded" />
                    </div>
                ))}
            </div>

            {/* Skeleton Table Rows */}
            <div className="bg-white border border-[#E4E2DD] rounded-md divide-y divide-[#E4E2DD] animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-28 bg-[#E4E2DD] rounded" />
                            <div className="h-4 w-20 bg-[#E4E2DD]/60 rounded hidden sm:block" />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-16 bg-[#E4E2DD]/80 rounded" />
                            <div className="h-7 w-14 bg-[#E4E2DD] rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
