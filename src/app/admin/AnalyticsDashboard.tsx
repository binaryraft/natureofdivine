
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics } from '@/lib/actions';
import { AnalyticsData } from '@/lib/definitions';
import { Loader2, Users, ShoppingCart, BarChart, UserPlus, Star, Target, ChevronsRight, MousePointerClick, IndianRupee, Calendar, MessageCircle } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart, CartesianGrid } from 'recharts';
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
    const [timeRange, setTimeRange] = useState<TimeRange>('daily');

    useEffect(() => {
        startTransition(async () => {
            const data = await fetchAnalytics(timeRange);
            setAnalyticsData(data);
        });
    }, [timeRange]);

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

    // Calculate totals for display if needed, but backend filtered data should be used directly for stats
    // Note: totalOrders is COD + Prepaid count
    const totalOrders = (analyticsData.orders?.cod || 0) + (analyticsData.orders?.prepaid || 0);
    const totalRevenue = analyticsData.salesOverTime.reduce((acc, curr) => acc + curr.value, 0); // Sum up sales from the time series
    
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
                                    <SelectItem value="weekly">Last 12 Weeks</SelectItem>
                                    <SelectItem value="monthly">Last 12 Months</SelectItem>
                                    <SelectItem value="yearly">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard title="Visitors" value={analyticsData.totalVisitors} icon={Users} description={`Sessions (${timeRange})`} />
                <StatCard title="Sales" value={totalOrders} icon={ShoppingCart} description={`Orders (${timeRange})`}/>
                <StatCard title="Revenue" value={`₹${totalRevenue}`} icon={IndianRupee} description={`Revenue (${timeRange})`}/>
                <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} icon={Target} description="Avg. for period" />
                <StatCard title="Community Visits" value={analyticsData.communityVisits || 0} icon={MessageCircle} description="Views in period"/>
            </div>

            {/* Time Series Charts */}
            <div className="grid gap-6 md:grid-cols-3">
                 <TimeSeriesChart 
                    data={analyticsData.visitorsOverTime}
                    title="Visitors"
                    description={`Unique sessions (${timeRange}).`}
                    color="#8884d8"
                    yLabel="Visitors"
                />
                 <TimeSeriesChart 
                    data={analyticsData.ordersOverTime}
                    title="Orders"
                    description={`Confirmed orders (${timeRange}).`}
                    color="#82ca9d"
                    yLabel="Orders"
                />
                 <TimeSeriesChart 
                    data={analyticsData.salesOverTime}
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
                        <CardDescription>User progression for the selected period.</CardDescription>
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
                        <CardDescription>Clicks to external stores in this period.</CardDescription>
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
                    description="Clicks on major call-to-action buttons."
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


    