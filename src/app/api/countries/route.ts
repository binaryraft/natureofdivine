import { NextResponse } from 'next/server';
import { getServiceableCountries } from '@/lib/envia-service';

/**
 * Optimized API route for fetching countries
 * Uses server-side caching to minimize Envia API calls
 */
export async function GET() {
    try {
        const countries = await getServiceableCountries();

        return NextResponse.json({
            success: true,
            countries,
            cached: true, // Indicates this might be from cache
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', // 24h cache, 48h stale
            }
        });
    } catch (error: any) {
        console.error("Error fetching countries:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
