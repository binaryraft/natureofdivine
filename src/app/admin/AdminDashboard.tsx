'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOrdersAction, changeOrderStatusAction, createDiscount, changeMultipleOrderStatusAction, fetchAnalytics, updateChapterAction, updateGalleryImageAction, addGalleryImageAction, deleteGalleryImageAction, getSettingsAction, updateSettingsAction, dispatchOrderAction } from '@/lib/actions';
import { type Order, type OrderStatus, type Stock, type BookVariant, type Discount, type AnalyticsData, SampleChapter, GalleryImage, SiteSettings } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, LogIn, Loader2, RefreshCw, Warehouse, Save, Tag, Percent, Trash2, Send, BarChart2, BookOpen, GalleryHorizontal, PlusCircle, ImagePlus, Upload, ExternalLink, Download, Settings, Link as LinkIcon, Edit, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStock, updateStock } from '@/lib/stock-store';
import { getAllDiscounts } from '@/lib/discount-store';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { getChapters, initializeChapters } from '@/lib/chapter-store';
import { sampleChapters as defaultChapters } from '@/lib/data';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getGalleryImages, initializeGalleryImages } from '@/lib/gallery-store';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { PricingManager } from './PricingManager';


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
                        <TableHead>Variant, Price & Shipping</TableHead>
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
                                {order.shippingDetails?.trackingNumber && (
                                    <div className="mt-2 text-muted-foreground">
                                       <span className="font-semibold">{order.shippingDetails.carrier}</span>: {order.shippingDetails.trackingNumber}
                                    </div>
                                )}
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
                                {order.shippingDetails?.cost ? (
                                     <div className="text-xs text-muted-foreground mt-1">
                                        Shipping: ₹{order.shippingDetails.cost}
                                    </div>
                                ) : null}
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

// ... SettingsManager, StockManager, etc ... (Existing code)

function DispatchDialog({ isOpen, onOpenChange, onSubmit, isSubmitting }: { isOpen: boolean, onOpenChange: (o: boolean) => void, onSubmit: (carrier: string, tracking: string) => void, isSubmitting: boolean }) {
    const [carrier, setCarrier] = useState('');
    const [tracking, setTracking] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(carrier, tracking);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dispatch Order</DialogTitle>
                    <DialogDescription>Enter the carrier and tracking details for this order.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="carrier">Carrier Name</Label>
                        <Input id="carrier" value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="e.g. BlueDart, Delhivery" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tracking">Tracking Number</Label>
                        <Input id="tracking" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Tracking ID" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Dispatch Order
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ... rest of managers ...

export function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Dispatch Dialog State
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [dispatchingOrder, setDispatchingOrder] = useState<{id: string, userId: string} | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // ... handleLogin, loadOrders, etc ...
  
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
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load orders.',
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
    if (!userId) return;

    if (newStatus === 'dispatched') {
        setDispatchingOrder({ id: orderId, userId });
        setDispatchDialogOpen(true);
        return;
    }

    try {
      await changeOrderStatusAction(userId, orderId, newStatus);
      toast({
        title: 'Success',
        description: 'Order status updated successfully.',
      });
      loadOrders(); 
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update order status.',
      });
    }
  };

  const handleDispatchSubmit = async (carrier: string, tracking: string) => {
      if (!dispatchingOrder) return;
      setIsDispatching(true);
      try {
          const result = await dispatchOrderAction(dispatchingOrder.userId, dispatchingOrder.id, carrier, tracking);
          if (result.success) {
              toast({ title: 'Success', description: result.message });
              setDispatchDialogOpen(false);
              loadOrders();
          } else {
              throw new Error(result.message);
          }
      } catch (error: any) {
           toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setIsDispatching(false);
      }
  };
  
  // ... rest of handlers ...

  // ... JSX ...

  // Inside the return, add <DispatchDialog ... />
  
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

    const handleExportOrders = () => {
        if (orders.length === 0) {
            toast({ title: "No orders", description: "There are no orders to export." });
            return;
        }

        // CSV Header
        const headers = ["Order ID", "Date", "Status", "Name", "Email", "Phone", "Address", "City", "State", "Country", "Pincode", "Variant", "Price", "Payment Method", "Discount Code"];
        
        // CSV Rows
        const rows = orders.map(order => [
            order.id,
            new Date(order.createdAt).toISOString().split('T')[0],
            order.status,
            `"${order.name}"`,
            order.email,
            order.phone,
            `"${order.address.replace(/"/g, '""')}"`,
            order.city,
            order.state,
            order.country,
            order.pinCode,
            order.variant,
            order.price,
            order.paymentMethod,
            order.discountCode || ""
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
        <DispatchDialog 
            isOpen={dispatchDialogOpen} 
            onOpenChange={setDispatchDialogOpen}
            onSubmit={handleDispatchSubmit}
            isSubmitting={isDispatching}
        />
        <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-8 overflow-x-auto">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="chapters">Chapters</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="discounts">Discounts</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-3xl font-headline flex items-center gap-2"><ShieldCheck /> Order Management</CardTitle>
                            <CardDescription>View and manage all incoming orders.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleExportOrders} variant="outline">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                            <Button onClick={loadOrders} variant="outline" size="icon" disabled={isPending}>
                                <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                            </Button>
                        </div>
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
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
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
            <TabsContent value="chapters" className="mt-6">
                <ChapterManager />
            </TabsContent>
             <TabsContent value="gallery" className="mt-6">
                <GalleryManager />
            </TabsContent>
            <TabsContent value="stock" className="mt-6">
                <StockManager />
            </TabsContent>
             <TabsContent value="discounts" className="mt-6">
                <DiscountManager />
            </TabsContent>
            <TabsContent value="pricing" className="mt-6">
                <PricingManager />
            </TabsContent>
            <TabsContent value="settings" className="mt-6">
                <SettingsManager />
            </TabsContent>
        </Tabs>
    </div>
  );
}
