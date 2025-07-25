
'use client';

import { useEffect, useState, useTransition } from 'react';
import { fetchOrders, changeOrderStatus } from '@/lib/actions';
import { type Order, type OrderStatus, Stock, BookVariant } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, LogIn, Loader2, RefreshCw, Warehouse, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStock, updateStock } from '@/lib/stock-store';
import { Label } from '@/components/ui/label';


const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-500',
    dispatched: 'bg-yellow-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
}

const OrderTable = ({ orders, onStatusChange }: { orders: Order[], onStatusChange: (orderId: string, newStatus: OrderStatus) => void }) => {
    if (orders.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No orders in this category.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Change Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id}</TableCell>
                            <TableCell>
                                <div className="font-medium">{order.name}</div>
                                <div className="text-sm text-muted-foreground">{order.email}</div>
                                {order.phone && <div className="text-sm text-muted-foreground">{order.phone}</div>}
                            </TableCell>
                            <TableCell className="text-xs">
                                {order.address ? `${order.address}, ${order.street}, ${order.city}, ${order.state}, ${order.country} - ${order.pinCode}` : 'N/A (E-book)'}
                            </TableCell>
                             <TableCell>
                                <Badge 
                                    variant={order.variant === 'hardcover' ? 'default' : (order.variant === 'paperback' ? 'secondary' : 'outline')} 
                                    className="capitalize"
                                >
                                    {order.variant}
                                </Badge>
                                <div>₹{order.price}</div>
                            </TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="uppercase font-mono text-xs">{order.paymentMethod}</TableCell>
                            <TableCell className="text-center">
                                 <Badge variant="secondary" className={cn("capitalize text-white", statusColors[order.status])}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Select
                                    defaultValue={order.status}
                                    onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
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
        </div>
    );
};

function StockManager() {
    const { toast } = useToast();
    const [stock, setStock] = useState<Stock | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(true);

    useEffect(() => {
        async function loadStock() {
            setIsLoadingStock(true);
            try {
                const fetchedStock = await getStock();
                setStock(fetchedStock);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to load stock levels.' });
            } finally {
                setIsLoadingStock(false);
            }
        }
        loadStock();
    }, [toast]);

    const handleStockChange = (variant: BookVariant, value: string) => {
        if (!stock) return;
        const quantity = parseInt(value, 10);
        if (!isNaN(quantity) && quantity >= 0) {
            setStock(prev => ({ ...prev!, [variant]: quantity }));
        }
    };

    const handleSave = async () => {
        if (!stock) return;
        setIsSaving(true);
        try {
            await updateStock(stock);
            toast({ title: 'Success', description: 'Stock levels updated successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update stock.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingStock || !stock) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Warehouse/> Stock Management</CardTitle>
                    <CardDescription>Update the quantity for each book variant. E-book stock is unlimited.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center p-4">
                        <Loader2 className="animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Warehouse/> Stock Management</CardTitle>
                <CardDescription>Update the quantity for each book variant. E-book stock is unlimited.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="paperback-stock">Paperback Quantity</Label>
                        <Input 
                            id="paperback-stock"
                            type="number" 
                            value={stock.paperback}
                            onChange={(e) => handleStockChange('paperback', e.target.value)}
                            min="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hardcover-stock">Hardcover Quantity</Label>
                        <Input 
                            id="hardcover-stock"
                            type="number"
                            value={stock.hardcover}
                             onChange={(e) => handleStockChange('hardcover', e.target.value)}
                             min="0"
                        />
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground">E-book stock is considered unlimited.</p>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Stock
                </Button>
            </CardFooter>
        </Card>
    );
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

  const categorizedOrders = {
    new: orders.filter(o => o.status === 'new'),
    dispatched: orders.filter(o => o.status === 'dispatched'),
    delivered: orders.filter(o => o.status === 'delivered'),
    cancelled: orders.filter(o => o.status === 'cancelled'),
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
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
    <div className="space-y-8">
        <StockManager />
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
             {isPending ? (
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : (
                <Tabs defaultValue="new">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="new">New ({categorizedOrders.new.length})</TabsTrigger>
                        <TabsTrigger value="dispatched">Dispatched ({categorizedOrders.dispatched.length})</TabsTrigger>
                        <TabsTrigger value="delivered">Delivered ({categorizedOrders.delivered.length})</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled ({categorizedOrders.cancelled.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new" className="mt-4">
                        <OrderTable orders={categorizedOrders.new} onStatusChange={handleStatusChange} />
                    </TabsContent>
                    <TabsContent value="dispatched" className="mt-4">
                        <OrderTable orders={categorizedOrders.dispatched} onStatusChange={handleStatusChange} />
                    </TabsContent>
                    <TabsContent value="delivered" className="mt-4">
                        <OrderTable orders={categorizedOrders.delivered} onStatusChange={handleStatusChange} />
                    </TabsContent>
                     <TabsContent value="cancelled" className="mt-4">
                        <OrderTable orders={categorizedOrders.cancelled} onStatusChange={handleStatusChange} />
                    </TabsContent>
                </Tabs>
             )}
          </CardContent>
        </Card>
    </div>
  );
}
