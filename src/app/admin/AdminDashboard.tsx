'use client';

import { useEffect, useState, useTransition } from 'react';
import { fetchOrders, changeOrderStatus } from '@/lib/actions';
import { type Order, type OrderStatus } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, LogIn, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';


const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-500',
    dispatched: 'bg-yellow-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This is not secure for production. Use a proper auth system.
    // For this demo, we use an environment variable.
    if (passcode === process.env.NEXT_PUBLIC_ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect passcode.');
    }
  };

  const loadOrders = () => {
    startTransition(async () => {
        try {
            const fetchedOrders = await fetchOrders();
            setOrders(fetchedOrders);
        } catch(e) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: "Failed to load orders. Check Firestore configuration.",
             });
        }
    });
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const result = await changeOrderStatus(orderId, newStatus);
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      // Optimistically update UI
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Admin Access</CardTitle>
            <CardDescription>Enter the passcode to view the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4"/>Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-3xl font-headline flex items-center gap-2"><ShieldCheck /> Order Management</CardTitle>
                <CardDescription>View and manage all incoming orders.</CardDescription>
            </div>
            <Button onClick={loadOrders} variant="outline" size="icon" disabled={isPending}>
                <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                 <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Change Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isPending && orders.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                             <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>
                        <div className="font-medium">{order.name}</div>
                        <div className="text-sm text-muted-foreground">{order.email}</div>
                         <div className="text-sm text-muted-foreground">{order.phone}</div>
                    </TableCell>
                     <TableCell className="text-xs">
                        {order.address}, {order.street}, {order.state}, {order.country} - {order.pinCode}
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="uppercase font-mono text-xs">{order.paymentMethod}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="secondary" className="capitalize text-white" style={{backgroundColor: statusColors[order.status].replace('bg-', '').replace('-500', '')}}>
                             {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <Select
                        defaultValue={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                    >
                        <SelectTrigger className="w-[150px] ml-auto">
                        <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            {!isPending && orders.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No orders yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
