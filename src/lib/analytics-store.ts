
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, query, orderBy, getDoc, doc, setDoc } from 'firebase/firestore';
import type { AnalyticsData, AnalyticsEvent, Review } from './definitions';
import { addLog } from './log-store';
import { sampleChapters } from './data';
import { getReviews } from './review-store';
import { getOrders } from './order-store';

const eventsCollection = collection(db, 'analyticsEvents');
const summaryDocRef = doc(db, 'analytics', 'summary');

export async function addEvent(type: string, metadata?: Record<string, any>): Promise<void> {
    try {
        const event: Omit<AnalyticsEvent, 'id'> = {
            type,
            timestamp: Timestamp.now().toMillis(),
            ...(metadata && { metadata }), // Only include metadata if it's defined and not null
        };
        await addDoc(eventsCollection, event);
    } catch (error: any) {
        // We don't want analytics to break the app, so we just log the error.
        addLog('error', 'Failed to add analytics event', { message: error.message, type });
    }
}

export async function getAnalytics(): Promise<AnalyticsData> {
    try {
        const eventsSnapshot = await getDocs(query(eventsCollection, orderBy('timestamp', 'asc')));
        const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));
        const reviews = await getReviews();
        const orders = await getOrders();

        // Initialize last 30 days map
        const timeSeriesMap: Record<string, { visitors: number, sales: number, orders: number }> = {};
        const now = new Date();
        // Set to start of today in local time for consistent bucketing, or just UTC date string
        // Using strict YYYY-MM-DD from ISO string is UTC based. 
        // For simplicity in this context, UTC dates are fine.
        
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            timeSeriesMap[dateStr] = { visitors: 0, sales: 0, orders: 0 };
        }

        const analytics: AnalyticsData = {
            totalVisitors: 0,
            clicks: {},
            checkoutFunnel: {
                reachedShipping: 0,
                completedShipping: 0,
            },
            orders: {
                cod: 0,
                prepaid: 0,
                prepaidInitiated: 0,
            },
            users: {
                login: 0,
                signup: 0,
            },
            sampleChapters: sampleChapters.reduce((acc, chap) => ({ ...acc, [chap.number]: 0 }), {}),
            reviews: {
                total: reviews.length,
                averageRating: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
            },
            visitorsOverTime: [],
            salesOverTime: [],
            ordersOverTime: [],
        };

        const uniqueVisitors = new Set();
        const visitorSessionsByDate = new Set<string>();

        for (const event of events) {
            // Clicks
            if (event.type.startsWith('click_')) {
                analytics.clicks[event.type] = (analytics.clicks[event.type] || 0) + 1;
            }
            // Page Views
            if (event.type.startsWith('page_view_')) {
                if (event.metadata?.sessionId && !uniqueVisitors.has(event.metadata.sessionId)) {
                    analytics.totalVisitors += 1;
                    uniqueVisitors.add(event.metadata.sessionId);
                }
                
                // Time Series Visitors
                if (event.metadata?.sessionId) {
                    const dateStr = new Date(event.timestamp).toISOString().split('T')[0];
                    // Only count if within our 30 day window
                    if (timeSeriesMap[dateStr]) {
                         const key = `${dateStr}:${event.metadata.sessionId}`;
                         if (!visitorSessionsByDate.has(key)) {
                             timeSeriesMap[dateStr].visitors++;
                             visitorSessionsByDate.add(key);
                         }
                    }
                }
            }
            // Checkout
            if (event.type === 'checkout_reached_shipping') analytics.checkoutFunnel.reachedShipping++;
            if (event.type === 'checkout_completed_shipping') analytics.checkoutFunnel.completedShipping++;

            // Orders (Counters from events)
            if (event.type === 'order_placed_cod') analytics.orders.cod++;
            if (event.type === 'order_placed_prepaid_initiated') analytics.orders.prepaidInitiated++;
            if (event.type === 'order_placed_prepaid_success') analytics.orders.prepaid++;

            // Users
            if (event.type === 'user_login') analytics.users.login++;
            if (event.type === 'user_signup') analytics.users.signup++;

            // Sample chapters
            if (event.type === 'view_sample_chapter' && event.metadata?.chapter) {
                const chapterNum = event.metadata.chapter;
                if (analytics.sampleChapters[chapterNum] !== undefined) {
                    analytics.sampleChapters[chapterNum]++;
                }
            }
        }

        // Process Orders for Time Series (Revenue & Counts)
        for (const order of orders) {
             // Consider only valid sales for revenue
             if (order.status === 'cancelled' || order.status === 'pending') continue;

             const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
             if (timeSeriesMap[dateStr]) {
                 timeSeriesMap[dateStr].orders++;
                 timeSeriesMap[dateStr].sales += order.price;
             }
        }

        const dates = Object.keys(timeSeriesMap).sort();
        analytics.visitorsOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].visitors }));
        analytics.salesOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].sales }));
        analytics.ordersOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].orders }));

        return analytics;
    } catch (error: any) {
        addLog('error', 'Failed to get analytics', { message: error.message });
        throw new Error('Could not fetch analytics data.');
    }
}
