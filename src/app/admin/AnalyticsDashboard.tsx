
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, trackEvent } from '@/lib/actions';
import { AnalyticsData } from '@/lib/definitions';
import { Loader2, Users, ShoppingCart, BarChart, ExternalLink, ArrowRight, UserPlus, BookOpen, Star } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { sampleChapters } from '@/lib/data';

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

export function AnalyticsDashboard() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            const data = await fetchAnalytics();
            setAnalyticsData(data);
        });
    }, []);

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
    
    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-2"><BarChart /> Website Analytics</CardTitle>
                    <CardDescription>An overview of user engagement and conversion metrics.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <StatCard title="Total Visitors" value={analyticsData.totalVisitors || 0} icon={Users} description="Unique homepage sessions" />
                <StatCard title="Total Orders" value={totalOrders} icon={ShoppingCart} description={`${analyticsData.orders?.cod || 0} COD, ${analyticsData.orders?.prepaid || 0} Prepaid`}/>
                <StatCard title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} icon={BarChart} description="Visitors to Orders" />
                <StatCard title="New Users" value={analyticsData.users?.signup || 0} icon={UserPlus} description={`${analyticsData.users?.login || 0} total logins`}/>
                <StatCard title="Avg. Rating" value={analyticsData.reviews?.averageRating.toFixed(1) || 'N/A'} icon={Star} description={`${analyticsData.reviews?.total || 0} total reviews`}/>
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
            
            {analyticsData.checkoutFunnel && (
             <Card>
                <CardHeader>
                    <CardTitle>Checkout Funnel</CardTitle>
                    <CardDescription>How users progress through the checkout process for signed copies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                         <div className="flex flex-col items-center">
                            <div className="text-3xl font-bold">{analyticsData.clicks?.['click_buy_signed_hero'] || 0}</div>
                            <p className="text-sm text-muted-foreground">Clicked "Buy Signed"</p>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
                        <div className="flex flex-col items-center">
                            <div className="text-3xl font-bold">{analyticsData.checkoutFunnel.reachedShipping}</div>
                            <p className="text-sm text-muted-foreground">Reached Shipping</p>
                        </div>
                         <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
                         <div className="flex flex-col items-center">
                            <div className="text-3xl font-bold">{analyticsData.checkoutFunnel.completedShipping}</div>
                            <p className="text-sm text-muted-foreground">Reached Payment</p>
                        </div>
                         <ArrowRight className="h-6 w-6 text-muted-foreground shrink-0" />
                          <div className="flex flex-col items-center">
                            <div className="text-3xl font-bold">{analyticsData.orders.cod + analyticsData.orders.prepaidInitiated}</div>
                            <p className="text-sm text-muted-foreground">Placed Order</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            )}

        </div>
    );
}
