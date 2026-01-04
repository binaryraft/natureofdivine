
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

export async function getAnalytics(timeRange: 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Promise<AnalyticsData> {
    try {
        const now = new Date();
        let startDate = new Date();
        let granularity: 'hour' | 'day' | 'week' | 'month' = 'day';

        // Determine Start Date & Granularity
        switch (timeRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                granularity = 'hour';
                break;
            case 'daily': // Last 30 Days
                startDate.setDate(now.getDate() - 30);
                granularity = 'day';
                break;
            case 'weekly': // Last 12 Weeks
                startDate.setDate(now.getDate() - 84);
                granularity = 'week';
                break;
            case 'monthly': // Last 12 Months
            case 'yearly':  // Last Year (Same for now)
                startDate.setFullYear(now.getFullYear() - 1);
                granularity = 'month';
                break;
        }

        const startTimestamp = startDate.getTime();

        const eventsSnapshot = await getDocs(query(eventsCollection, orderBy('timestamp', 'asc')));
        // Filter events by date range
        const events = eventsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent))
            .filter(e => e.timestamp >= startTimestamp);

        const reviews = await getReviews(); // Reviews might be all-time or filtered? Usually ratings are all-time. Let's keep all-time for rating avg, but count could be filtered. Let's keep reviews all-time for now as it's "Avg Rating".
        const allOrders = await getOrders();
        // Filter orders by date range
        const orders = allOrders.filter(o => o.createdAt >= startTimestamp);

        // Initialize Buckets
        const timeSeriesMap: Record<string, { visitors: number, sales: number, orders: number }> = {};
        
        // Helper to generate keys
        const getKey = (date: Date): string => {
            if (granularity === 'hour') return `${date.getHours().toString().padStart(2, '0')}:00`;
            if (granularity === 'day') return date.toISOString().split('T')[0];
            if (granularity === 'week') {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d.setDate(diff));
                return monday.toISOString().split('T')[0];
            }
            if (granularity === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return date.toISOString().split('T')[0];
        };

        // Initialize map with empty buckets to ensure continuity (optional but good for charts)
        // For 'today', fill 0-23 hours. For others, maybe just let data drive or fill gaps. 
        // Filling gaps is safer for charts.
        let iterateDate = new Date(startDate);
        while (iterateDate <= now) {
            timeSeriesMap[getKey(iterateDate)] = { visitors: 0, sales: 0, orders: 0 };
            
            // Increment logic
            if (granularity === 'hour') iterateDate.setHours(iterateDate.getHours() + 1);
            else if (granularity === 'day') iterateDate.setDate(iterateDate.getDate() + 1);
            else if (granularity === 'week') iterateDate.setDate(iterateDate.getDate() + 7);
            else if (granularity === 'month') iterateDate.setMonth(iterateDate.getMonth() + 1);
            else iterateDate.setDate(iterateDate.getDate() + 1);
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
            communityVisits: 0,
            today: { visitors: 0, sales: 0, orders: 0 }, // Not strictly used if we return filtered data, but kept for type compat
            hourlyTraffic: [],
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
            const date = new Date(event.timestamp);
            const key = getKey(date);

            // Clicks
            if (event.type.startsWith('click_')) {
                analytics.clicks[event.type] = (analytics.clicks[event.type] || 0) + 1;
            }
            // Page Views
            if (event.type.startsWith('page_view_')) {
                // Total unique visitors in this period
                if (event.metadata?.sessionId && !uniqueVisitors.has(event.metadata.sessionId)) {
                    analytics.totalVisitors += 1;
                    uniqueVisitors.add(event.metadata.sessionId);
                }
                
                // Time Series Visitors
                if (event.metadata?.sessionId) {
                    if (timeSeriesMap[key]) {
                         const sessionKey = `${key}:${event.metadata.sessionId}`;
                         if (!visitorSessionsByDate.has(sessionKey)) {
                             timeSeriesMap[key].visitors++;
                             visitorSessionsByDate.add(sessionKey);
                         }
                    }
                }
            }
            
            // Community Visits
            if (event.type === 'view_community' || event.type === 'view_question') {
                analytics.communityVisits++;
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

             const date = new Date(order.createdAt);
             const key = getKey(date);
             
             if (timeSeriesMap[key]) {
                 timeSeriesMap[key].orders++;
                 timeSeriesMap[key].sales += order.price;
             }
        }

        const dates = Object.keys(timeSeriesMap).sort();
        analytics.visitorsOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].visitors }));
        analytics.salesOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].sales }));
        analytics.ordersOverTime = dates.map(date => ({ date, value: timeSeriesMap[date].orders }));
        
        // For 'today', we can just map the hourly buckets to hourlyTraffic for backward compat or specialized UI
        if (timeRange === 'today') {
             analytics.hourlyTraffic = analytics.visitorsOverTime;
             analytics.today = {
                 visitors: analytics.totalVisitors,
                 sales: analytics.salesOverTime.reduce((a, b) => a + b.value, 0),
                 orders: analytics.ordersOverTime.reduce((a, b) => a + b.value, 0)
             };
        }

        return analytics;
    } catch (error: any) {
        addLog('error', 'Failed to get analytics', { message: error.message });
        throw new Error('Could not fetch analytics data.');
    }
}
