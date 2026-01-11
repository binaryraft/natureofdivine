
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

export async function getAnalytics(timeRange: 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' = 'daily', customRange?: { start: number, end: number }): Promise<AnalyticsData> {
    try {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(); // Default end is now
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
            case 'custom':
                if (customRange) {
                    startDate = new Date(customRange.start);
                    endDate = new Date(customRange.end);
                    // Adjust end date to end of day if it looks like start of day
                    if (endDate.getHours() === 0) endDate.setHours(23, 59, 59, 999);

                    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                    if (diffDays <= 1) granularity = 'hour';
                    else if (diffDays <= 60) granularity = 'day';
                    else if (diffDays <= 180) granularity = 'week';
                    else granularity = 'month';
                }
                break;
        }

        const startTimestamp = startDate.getTime();
        const endTimestamp = endDate.getTime();

        const eventsSnapshot = await getDocs(query(eventsCollection, orderBy('timestamp', 'asc')));
        // Filter events by date range
        const events = eventsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as AnalyticsEvent))
            .filter(e => e.timestamp >= startTimestamp && e.timestamp <= endTimestamp);

        const reviews = await getReviews();
        const allOrders = await getOrders();
        // Filter orders by date range
        const orders = allOrders.filter(o => o.createdAt >= startTimestamp && o.createdAt <= endTimestamp);

        // Initialize Buckets
        const timeSeriesMap: Record<string, { visitors: number, sales: number, orders: number }> = {};

        // Helper to generate keys
        const getKey = (date: Date): string => {
            if (granularity === 'hour') return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:00`;
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

        // Initialize map with empty buckets to ensure continuity
        let iterateDate = new Date(startDate);
        while (iterateDate <= endDate) {
            timeSeriesMap[getKey(iterateDate)] = { visitors: 0, sales: 0, orders: 0 };

            // Increment logic
            if (granularity === 'hour') iterateDate.setHours(iterateDate.getHours() + 1);
            else if (granularity === 'day') iterateDate.setDate(iterateDate.getDate() + 1);
            else if (granularity === 'week') iterateDate.setDate(iterateDate.getDate() + 7);
            else if (granularity === 'month') iterateDate.setMonth(iterateDate.getMonth() + 1);
            // Default increment to prevent infinite loop if granularity is messed up
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
            today: { visitors: 0, sales: 0, orders: 0 },
            hourlyTraffic: [],
            sampleChapters: sampleChapters.reduce((acc, chap) => ({ ...acc, [chap.number]: 0 }), {}),
            reviews: {
                total: reviews.length,
                averageRating: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
            },
            visitorsOverTime: [],
            salesOverTime: [],
            ordersOverTime: [],
            pageViews: {}, // Track individual page routes
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
            // Page Views & Route Tracking
            if (event.type.startsWith('page_view_')) {
                // Route/Page tracking (extract route from type or metadata)
                // Assuming type is like 'page_view_/about' or 'page_view_home'
                let routeName = event.type.replace('page_view_', '');
                // Fallback if we used metadata for path in some implementations
                if (routeName === 'route' && event.metadata?.path) {
                    routeName = event.metadata.path;
                }

                // Unify route names
                if (routeName === 'home' || routeName === '/') routeName = '/';
                else if (!routeName.startsWith('/')) routeName = '/' + routeName;

                analytics.pageViews[routeName] = (analytics.pageViews[routeName] || 0) + 1;

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

            if (event.type === 'view_community' || event.type === 'view_question') analytics.communityVisits++;
            if (event.type === 'checkout_reached_shipping') analytics.checkoutFunnel.reachedShipping++;
            if (event.type === 'checkout_completed_shipping') analytics.checkoutFunnel.completedShipping++;
            if (event.type === 'order_placed_cod') analytics.orders.cod++;
            if (event.type === 'order_placed_prepaid_initiated') analytics.orders.prepaidInitiated++;
            if (event.type === 'order_placed_prepaid_success') analytics.orders.prepaid++;
            if (event.type === 'user_login') analytics.users.login++;
            if (event.type === 'user_signup') analytics.users.signup++;

            if (event.type === 'view_sample_chapter' && event.metadata?.chapter) {
                const chapterNum = event.metadata.chapter;
                if (analytics.sampleChapters[chapterNum] !== undefined) {
                    analytics.sampleChapters[chapterNum]++;
                }
            }
        }

        // Process Orders for Time Series (Revenue & Counts)
        for (const order of orders) {
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
