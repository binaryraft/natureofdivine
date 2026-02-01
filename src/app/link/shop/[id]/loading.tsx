import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Image Skeleton */}
                <div className="aspect-square rounded-3xl overflow-hidden bg-muted/20 border border-border/50">
                    <Skeleton className="h-full w-full" />
                </div>

                {/* Details Skeleton */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-8 w-1/4" />
                    </div>

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>

                    <Skeleton className="h-14 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
