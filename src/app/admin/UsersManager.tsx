
'use client';

import { useState, useMemo } from 'react';
import { Order } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, ShoppingBag, Calendar, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type UserSummary = {
    userId: string;
    name: string;
    email: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: number;
    firstOrderDate: number;
    status: 'active' | 'inactive'; // Simple logic: active if order in last 30 days
};

export function UsersManager({ orders }: { orders: Order[] }) {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'spent' | 'orders' | 'recent'>('recent');

    const users: UserSummary[] = useMemo(() => {
        const userMap: Record<string, UserSummary> = {};

        orders.forEach(order => {
            const userId = order.userId;
            if (!userId) return;

            const orderDate = new Date(order.createdAt).getTime();

            if (!userMap[userId]) {
                userMap[userId] = {
                    userId,
                    name: order.name,
                    email: order.email,
                    phone: order.phone || 'N/A',
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrderDate: orderDate,
                    firstOrderDate: orderDate,
                    status: 'inactive'
                };
            }

            userMap[userId].orderCount += 1;
            userMap[userId].totalSpent += order.price;
            
            if (orderDate > userMap[userId].lastOrderDate) {
                userMap[userId].lastOrderDate = orderDate;
                // Update contact info from most recent order
                userMap[userId].name = order.name;
                userMap[userId].email = order.email;
                if (order.phone) userMap[userId].phone = order.phone;
            }
            if (orderDate < userMap[userId].firstOrderDate) {
                userMap[userId].firstOrderDate = orderDate;
            }
        });

        // Determine status
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        Object.values(userMap).forEach(u => {
            if (u.lastOrderDate > thirtyDaysAgo) u.status = 'active';
        });

        return Object.values(userMap);
    }, [orders]);

    const filteredUsers = users
        .filter(u => 
            u.name.toLowerCase().includes(search.toLowerCase()) || 
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.phone.includes(search)
        )
        .sort((a, b) => {
            if (sort === 'spent') return b.totalSpent - a.totalSpent;
            if (sort === 'orders') return b.orderCount - a.orderCount;
            return b.lastOrderDate - a.lastOrderDate;
        });

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> User Management</CardTitle>
                        <CardDescription>View all customers who have placed orders.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name, email, phone..." 
                            className="pl-8" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant={sort === 'recent' ? 'default' : 'outline'} size="sm" onClick={() => setSort('recent')}>
                            Recent
                        </Button>
                        <Button variant={sort === 'orders' ? 'default' : 'outline'} size="sm" onClick={() => setSort('orders')}>
                            Most Orders
                        </Button>
                         <Button variant={sort === 'spent' ? 'default' : 'outline'} size="sm" onClick={() => setSort('spent')}>
                            Highest Spenders
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Orders</TableHead>
                                <TableHead className="text-right">Total Spent</TableHead>
                                <TableHead className="text-right">Last Active</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No users found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map(user => (
                                    <TableRow key={user.userId}>
                                        <TableCell>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{user.userId.slice(0, 8)}...</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{user.email}</div>
                                            <div className="text-sm text-muted-foreground">{user.phone}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {user.orderCount}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹{user.totalSpent.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {new Date(user.lastOrderDate).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
