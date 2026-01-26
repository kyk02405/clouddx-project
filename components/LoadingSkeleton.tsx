export default function LoadingSkeleton({ type = "card" }: { type?: "card" | "list" }) {
    if (type === "list") {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-gray-700"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-gray-700"></div>
                            <div className="h-3 w-1/2 rounded bg-gray-800"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="animate-pulse space-y-4">
                <div className="h-6 w-3/4 rounded bg-gray-700"></div>
                <div className="h-4 w-full rounded bg-gray-800"></div>
                <div className="h-4 w-5/6 rounded bg-gray-800"></div>
            </div>
        </div>
    );
}
