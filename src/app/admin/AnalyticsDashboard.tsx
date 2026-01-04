
'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, trackEvent } from '@/lib/actions';
import { AnalyticsData, TimeSeriesDataPoint } from '@/lib/definitions';
import { Loader2, Users, ShoppingCart, BarChart, ExternalLink, ArrowRight, UserPlus, BookOpen, Star, Target, ChevronsRight, MousePointerClick, TrendingUp, IndianRupee, Calendar, MessageCircle } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart, CartesianGrid } from 'recharts';
import { sampleChapters } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function StatCard({ title, value, icon: Icon, description }: { title: string; value: string | number; icon: React.ElementType; description?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}

function SimpleBarChart({ data, xKey, yKey, title, description }: { data: any[], xKey: string, yKey: string, title: string, description: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={data}>
                        <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend />
                        <Bar dataKey={yKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function TimeSeriesChart({ data, title, description, color, yLabel, formatter }: { data: any[], title: string, description: string, color: string, yLabel: string, formatter?: (val: any) => string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`color${yLabel.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="date" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => {
                                // For hourly data
                                if (value.includes(':')) return value;
                                // For yearly data
                                if (value.length <= 4) return value;
                                const date = new Date(value);
                                if (isNaN(date.getTime())) return value;
                                return value.length > 7 ? `${date.getDate()}/${date.getMonth() + 1}` : `${date.toLocaleString('default', { month: 'short' })}`;
                            }}
                        />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatter} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" opacity={0.4}/>
                        <Tooltip 
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                            labelFormatter={(label) => {
                                if (label.includes(':')) return `Time: ${label}`;
                                const d = new Date(label);
                                return isNaN(d.getTime()) ? label : d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                            }}
                            formatter={(value: any) => [formatter ? formatter(value) : value, yLabel]}
                        />
                        <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#color${yLabel.replace(/\s/g, '')})`} name={yLabel} />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function FunnelStep({ value, label, icon: Icon }: {value: number, label: string, icon: React.ElementType}) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center bg-primary/10 rounded-full w-16 h-16 mb-2 border-2 border-primary/20">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    )
}

type TimeRange = 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export function AnalyticsDashboard() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isPending, startTransition] = useTransition();
    const [timeRange, setTimeRange] = useState<TimeRange>('today');

    useEffect(() => {
        startTransition(async () => {
            const data = await fetchAnalytics();
            setAnalyticsData(data);
        });
    }, []);

    const { processedData, currentStats } = useMemo(() => {
        if (!analyticsData) {
            return { 
                processedData: { visitors: [], sales: [], orders: [] },
                currentStats: { visitors: 0, orders: 0, sales: 0 }
            };
        }

        const { visitorsOverTime, salesOverTime, ordersOverTime, today, hourlyTraffic } = analyticsData;

        if (timeRange === 'today') {
            return {
                processedData: {
                    visitors: hourlyTraffic,
                    sales: [], // Hourly sales not yet implemented
                    orders: [] // Hourly orders not yet implemented
                },
                currentStats: today
            };
        }

        const aggregate = (data: TimeSeriesDataPoint[]) => {
            if (timeRange === 'daily') {
                // Return last 30 days
                return data.slice(-30);
            }

            const map = new Map<string, number>();

            data.forEach(item => {
                const date = new Date(item.date);
                let key = '';

                if (timeRange === 'weekly') {
                    const d = new Date(date);
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(d.setDate(diff));
                    key = monday.toISOString().split('T')[0];
                } else if (timeRange === 'monthly') {
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                } else if (timeRange === 'yearly') {
                    key = `${date.getFullYear()}`;
                }

                map.set(key, (map.get(key) || 0) + item.value);
            });

            return Array.from(map.entries())
                .map(([date, value]) => ({ date, value }))
                .sort((a, b) => a.date.localeCompare(b.date));
        };

        const processedVisitors = aggregate(visitorsOverTime);
        const processedSales = aggregate(salesOverTime);
        const processedOrders = aggregate(ordersOverTime);

        return {
            processedData: {
                visitors: processedVisitors,
                sales: processedSales,
                orders: processedOrders
            },
            currentStats: {
                visitors: processedVisitors.reduce((acc, curr) => acc + curr.value, 0),
                sales: processedSales.reduce((acc, curr) => acc + curr.value, 0),
                orders: processedOrders.reduce((acc, curr) => acc + curr.value, 0)
            }
        };

    }, [analyticsData, timeRange]);

    if (isPending || !analyticsData) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Loading analytics...</p>
            </div>
        );
    }
    
    const clickData = analyticsData.clicks ? Object.entries(analyticsData.clicks).map(([key, value]) => ({ name: key.replace('click_', '').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()), clicks: value })) : [];
    const chapterData = analyticsData.sampleChapters ? Object.entries(analyticsData.sampleChapters).map(([key, value]) => ({ name: `Ch. ${key}`, views: value })) : [];

    const totalOrders = (analyticsData.orders?.cod || 0) + (analyticsData.orders?.prepaid || 0);
    const conversionRate = analyticsData.totalVisitors > 0 ? (totalOrders / analyticsData.totalVisitors) * 100 : 0;
    
    const amazonClicks = (analyticsData.clicks?.['click_buy_amazon_hero'] || 0) + (analyticsData.clicks?.['click_buy_amazon_footer'] || 0);
    const flipkartClicks = (analyticsData.clicks?.['click_buy_flipkart_hero'] || 0) + (analyticsData.clicks?.['click_buy_flipkart_footer'] || 0);

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl font-headline flex items-center gap-2"><BarChart /> Website Analytics</CardTitle>
                            <CardDescription>An overview of user engagement and conversion metrics.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="daily">Last 30 Days</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard title="Visitors" value={currentStats.visitors} icon={Users} description={`Sessions (${timeRange})`} />
                <StatCard title="Sales" value={currentStats.orders} icon={ShoppingCart} description={`Orders (${timeRange})`}/>
                <StatCard title="Revenue" value={`₹${currentStats.sales}`} icon={IndianRupee} description={`Revenue (${timeRange})`}/>
                <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} icon={Target} description="All-time Avg." />
                <StatCard title="Community Visits" value={analyticsData.communityVisits || 0} icon={MessageCircle} description="All-time views"/>
            </div>

            {/* Time Series Charts */}
            <div className="grid gap-6 md:grid-cols-3">
                 <TimeSeriesChart 
                    data={processedData.visitors}
                    title="Visitors"
                    description={`Unique sessions (${timeRange}).`}
                    color="#8884d8"
                    yLabel="Visitors"
                />
                 <TimeSeriesChart 
                    data={processedData.orders}
                    title="Orders"
                    description={`Confirmed orders (${timeRange}).`}
                    color="#82ca9d"
                    yLabel="Orders"
                />
                 <TimeSeriesChart 
                    data={processedData.sales}
                    title="Revenue"
                    description={`Sales revenue (${timeRange}).`}
                    color="#ffc658"
                    yLabel="Revenue"
                    formatter={(val) => `₹${val}`}
                />
            </div>
            
             <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Funnel (Signed Copies)</CardTitle>
                        <CardDescription>How users progress from visit to a direct sale.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-around gap-2 md:gap-4 flex-wrap">
                        <FunnelStep value={analyticsData.totalVisitors} label="Website Visits" icon={Users}/>
                        <ChevronsRight className="h-8 w-8 text-muted-foreground shrink-0 hidden md:block"/>
                        <FunnelStep value={analyticsData.checkoutFunnel.reachedShipping} label="Checkout Page" icon={MousePointerClick}/>
                         <ChevronsRight className="h-8 w-8 text-muted-foreground shrink-0 hidden md:block"/>
                        <FunnelStep value={totalOrders} label="Order Placed" icon={ShoppingCart}/>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Outbound Traffic</CardTitle>
                        <CardDescription>Where users go after visiting the site.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-around gap-2 md:gap-4 flex-wrap">
                       <FunnelStep value={analyticsData.totalVisitors} label="Website Visits" icon={Users}/>
                       <ChevronsRight className="h-8 w-8 text-muted-foreground shrink-0 hidden md:block"/>
                       <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-4">
                                <p className="font-bold text-2xl">{amazonClicks}</p>
                                <p>clicks to Amazon</p>
                           </div>
                            <div className="flex items-center gap-4">
                                <p className="font-bold text-2xl">{flipkartClicks}</p>
                                <p>clicks to Flipkart</p>
                           </div>
                       </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                 <SimpleBarChart 
                    data={clickData}
                    xKey="name"
                    yKey="clicks"
                    title="Button Clicks"
                    description="Clicks on major call-to-action buttons across the site."
                />
                 <SimpleBarChart 
                    data={chapterData}
                    xKey="name"
                    yKey="views"
                    title="Sample Chapter Views"
                    description="How many times each sample chapter was opened."
                />
            </div>
        </div>
    );
}


    