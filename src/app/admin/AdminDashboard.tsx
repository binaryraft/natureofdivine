
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOrdersAction, changeOrderStatusAction, createDiscount, changeMultipleOrderStatusAction, fetchAnalytics } from '@/lib/actions';
import { type Order, type OrderStatus, type Stock, type BookVariant, type Discount, type AnalyticsData } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, LogIn, Loader2, RefreshCw, Warehouse, Save, Tag, Percent, Trash2, Send, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStock, updateStock } from '@/lib/stock-store';
import { getAllDiscounts } from '@/lib/discount-store';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AnalyticsDashboard } from './AnalyticsDashboard';


const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-500',
    dispatched: 'bg-yellow-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
    pending: 'bg-gray-500'
}

const OrderTable = ({ 
    orders, 
    onStatusChange, 
    selectedOrders,
    onSelectionChange
}: { 
    orders: Order[], 
    onStatusChange: (userId: string, orderId: string, newStatus: OrderStatus) => void,
    selectedOrders: string[],
    onSelectionChange: (orderId: string, checked: boolean) => void
}) => {

    const handleSelectAll = (checked: boolean) => {
        orders.forEach(order => onSelectionChange(order.id, checked));
    }
    
    if (orders.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No orders in this category.</p>;
    }

    const allSelected = orders.length > 0 && orders.every(order => selectedOrders.includes(order.id));
    const isIndeterminate = !allSelected && orders.some(order => selectedOrders.includes(order.id));

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                           <Checkbox
                                onCheckedChange={handleSelectAll}
                                checked={allSelected}
                                aria-label="Select all rows"
                            />
                        </TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Variant & Price</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Change Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id} data-state={selectedOrders.includes(order.id) ? "selected" : ""}>
                            <TableCell>
                                <Checkbox 
                                    onCheckedChange={(checked) => onSelectionChange(order.id, !!checked)}
                                    checked={selectedOrders.includes(order.id)}
                                    aria-label={`Select order ${order.id}`}
                                />
                            </TableCell>
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
                                <div className="font-medium">₹{order.price}</div>
                                {order.discountCode && (
                                     <div className="text-xs text-green-600">
                                        Applied: {order.discountCode} (-₹{order.discountAmount})
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="uppercase font-mono text-xs">{order.paymentMethod}</TableCell>
                            <TableCell className="text-center">
                                 <Badge variant="outline" className={cn("capitalize text-white", statusColors[order.status])}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Select
                                    defaultValue={order.status}
                                    onValueChange={(value) => onStatusChange(order.userId!, order.id, value as OrderStatus)}
                                >
                                    <SelectTrigger className="w-[150px] ml-auto">
                                        <SelectValue placeholder="Change status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="dispatched">Dispatched</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="pending" disabled>Pending</SelectItem>
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
    const router = useRouter();
    const [stock, setStock] = useState<Stock | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStock, setIsLoadingStock] = useState(true);

    const loadStock = async () => {
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

    useEffect(() => {
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
            router.refresh();
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

function DiscountManager() {
    const { toast } = useToast();
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCode, setNewCode] = useState('');
    const [newPercent, setNewPercent] = useState('');

    const loadDiscounts = async () => {
        setIsLoading(true);
        try {
            const fetchedDiscounts = await getAllDiscounts();
            setDiscounts(fetchedDiscounts);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load discounts.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    useEffect(() => {
        loadDiscounts();
    }, [toast]);

    const handleCreateDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const percent = parseInt(newPercent, 10);
        const result = await createDiscount(newCode, percent);

        if(result.success) {
            toast({ title: 'Success!', description: result.message });
            setNewCode('');
            setNewPercent('');
            await loadDiscounts();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsCreating(false);
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag/> Discount Management</CardTitle>
                <CardDescription>Create and manage discount codes for influencer marketing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleCreateDiscount} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="code">Discount Code</Label>
                        <Input id="code" placeholder="e.g., INFLUENCER10" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} required/>
                    </div>
                     <div className="flex-1 space-y-2">
                        <Label htmlFor="percent">Discount Percent</Label>
                         <div className="relative">
                            <Input id="percent" type="number" placeholder="e.g., 10" value={newPercent} onChange={e => setNewPercent(e.target.value)} required min="1" max="100"/>
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" disabled={isCreating}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create
                        </Button>
                    </div>
                </form>
                
                <div className="space-y-2">
                    <h3 className="font-medium">Existing Discounts</h3>
                    {isLoading ? (
                         <div className="flex justify-center items-center p-4">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Percent</TableHead>
                                    <TableHead className="text-right">Usage Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discounts.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No discounts created yet.</TableCell></TableRow>}
                                {discounts.map(d => (
                                    <TableRow key={d.id}>
                                        <TableCell className="font-mono">{d.id}</TableCell>
                                        <TableCell>{d.percent}%</TableCell>
                                        <TableCell className="text-right">{d.usageCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function BulkActions({ selectedCount, onAction }: { selectedCount: number; onAction: (status: OrderStatus) => void }) {
    if (selectedCount === 0) return null;

    return (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border my-4">
            <p className="text-sm font-medium">{selectedCount} order{selectedCount > 1 ? 's' : ''} selected</p>
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => onAction('dispatched')}>
                    <Send className="mr-2 h-4 w-4" />
                    Mark as Dispatched
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onAction('cancelled')}>
                     <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Selected
                </Button>
            </div>
        </div>
    );
}

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

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
            const fetchedOrders = await fetchOrdersAction();
            setOrders(fetchedOrders);
            setSelectedOrders([]); // Clear selection on refresh
        } catch(e: any) {
            let description = "Failed to load orders. Please try again later.";
            if (e.message && e.message.includes("indexes?create_composite")) {
                 const urlMatch = e.message.match(/(https?:\/\/[^\s]+)/);
                 if (urlMatch) {
                    const firebaseUrl = urlMatch[0].replace(/\\"/g, '');
                    toast({
                        variant: 'destructive',
                        title: 'Database Index Required',
                        description: (
                            <div>
                                A database index is required to fetch all orders. Please click the link to create it in the Firebase Console, then refresh this page.
                                <a href={firebaseUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold ml-2">Create Index</a>
                            </div>
                        ),
                         duration: 30000,
                    });
                    return;
                 }
            }
             toast({
                variant: 'destructive',
                title: 'Error',
                description: description,
             });
        }
    });
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (userId: string, orderId: string, newStatus: OrderStatus) => {
    if (!userId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Cannot change status: User ID is missing for this order.'
        });
        return;
    }
    try {
      await changeOrderStatusAction(userId, orderId, newStatus);
      toast({
        title: 'Success',
        description: 'Order status updated successfully.',
      });
      loadOrders(); // Refresh the list to show the updated status
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update order status.',
      });
    }
  };

    const handleSelectionChange = (orderId: string, checked: boolean) => {
        setSelectedOrders(prev => 
            checked ? [...prev, orderId] : prev.filter(id => id !== orderId)
        );
    }
    
    const handleBulkStatusChange = async (status: OrderStatus) => {
        setIsBulkUpdating(true);
        try {
            const ordersToUpdate = selectedOrders
                .map(id => orders.find(o => o.id === id))
                .filter(o => o && o.userId)
                .map(o => ({ orderId: o!.id, userId: o!.userId! }));

            if (ordersToUpdate.length > 0) {
                 const result = await changeMultipleOrderStatusAction(ordersToUpdate, status);
                 if(result.success) {
                    toast({ title: 'Success', description: result.message });
                 } else {
                    throw new Error(result.message);
                 }
            }
            loadOrders();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Bulk Update Failed',
                description: error.message || 'Could not update all selected orders.',
            });
        } finally {
            setIsBulkUpdating(false);
        }
    }

  const categorizedOrders = {
    new: orders.filter(o => o.status === 'new'),
    dispatched: orders.filter(o => o.status === 'dispatched'),
    delivered: orders.filter(o => o.status === 'delivered'),
    cancelled: orders.filter(o => o.status === 'cancelled'),
    pending: orders.filter(o => o.status === 'pending')
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
    <div className="container mx-auto py-12 md:py-16 space-y-8">
        <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-6">
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
                     {isPending || isBulkUpdating ? (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2">{isBulkUpdating ? 'Applying bulk actions...' : 'Loading orders...'}</p>
                        </div>
                     ) : (
                        <Tabs defaultValue="new" className="w-full" onValueChange={() => setSelectedOrders([])}>
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="new">New ({categorizedOrders.new.length})</TabsTrigger>
                                <TabsTrigger value="dispatched">Dispatched ({categorizedOrders.dispatched.length})</TabsTrigger>
                                <TabsTrigger value="delivered">Delivered ({categorizedOrders.delivered.length})</TabsTrigger>
                                <TabsTrigger value="pending">Pending ({categorizedOrders.pending.length})</TabsTrigger>
                                <TabsTrigger value="cancelled">Cancelled ({categorizedOrders.cancelled.length})</TabsTrigger>
                            </TabsList>
                            <BulkActions selectedCount={selectedOrders.length} onAction={handleBulkStatusChange}/>
                            <TabsContent value="new" className="mt-4">
                                <OrderTable orders={categorizedOrders.new} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                            </TabsContent>
                            <TabsContent value="dispatched" className="mt-4">
                                <OrderTable orders={categorizedOrders.dispatched} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                            </TabsContent>
                            <TabsContent value="delivered" className="mt-4">
                                <OrderTable orders={categorizedOrders.delivered} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                            </TabsContent>
                             <TabsContent value="pending" className="mt-4">
                                <OrderTable orders={categorizedOrders.pending} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                            </TabsContent>
                             <TabsContent value="cancelled" className="mt-4">
                                <OrderTable orders={categorizedOrders.cancelled} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                            </TabsContent>
                        </Tabs>
                     )}
                  </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="analytics" className="mt-6">
                <AnalyticsDashboard />
            </TabsContent>
            <TabsContent value="stock" className="mt-6">
                <StockManager />
            </TabsContent>
             <TabsContent value="discounts" className="mt-6">
                <DiscountManager />
            </TabsContent>
        </Tabs>
    </div>
  );
}
