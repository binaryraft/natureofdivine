'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOrdersAction, changeOrderStatusAction, createDiscount, changeMultipleOrderStatusAction, fetchAnalytics, updateChapterAction, getSettingsAction, updateSettingsAction, dispatchOrderAction, deleteDiscountAction, updateComboBookStatusAction } from '@/lib/actions';
import { type Order, type OrderStatus, type Stock, type BookVariant, type Discount, type AnalyticsData, SampleChapter, SiteSettings } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, LogIn, Loader2, RefreshCw, Warehouse, Save, Tag, Percent, Trash2, Send, BarChart2, BookOpen, GalleryHorizontal, PlusCircle, ImagePlus, Upload, ExternalLink, Download, Settings, Link as LinkIcon, Edit, Truck, Package } from 'lucide-react';
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
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { v4 as uuidv4 } from 'uuid';
import { PricingManager } from './PricingManager';
import { UsersManager } from './UsersManager';
import { CommunityManager } from './CommunityManager';
import { BlogsManager } from './BlogsManager';
import { LogsManager } from './LogsManager';
import { ShopManager } from './ShopManager';
import SupportChatManager from './SupportChatManager';


const statusColors: Record<OrderStatus, string> = {
    new: 'bg-blue-500',
    pending: 'bg-gray-500',
    dispatched: 'bg-yellow-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500',
    breached: 'bg-orange-500',
    refunded: 'bg-purple-500'
}

const ComboDetailsDialog = ({ 
    order, 
    onClose 
}: { 
    order: Order, 
    onClose: () => void 
}) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleBookStatusChange = async (itemIndex: number, subItemIndex: number, newStatus: string) => {
        const bookId = order.items[itemIndex].subItems![subItemIndex].bookId;
        setIsUpdating(`${itemIndex}-${subItemIndex}`);
        try {
            const res = await updateComboBookStatusAction(order.userId, order.id, itemIndex, subItemIndex, newStatus);
            if (res.success) {
                toast({ title: 'Status Updated', description: `Book status changed to ${newStatus}` });
                // We rely on revalidatePath in the action, but local state update would be smoother
                // For simplicity, we just let the parent refresh or similar
            } else {
                toast({ variant: 'destructive', title: 'Error', description: res.message });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Combo Fulfillment Tracking
                    </DialogTitle>
                    <DialogDescription>
                        Manage sourcing status for individual books in this combo order (#{order.id.slice(-6)})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {order.items.filter(i => i.type === 'combo').map((item, itemIdx) => (
                        <div key={itemIdx} className="space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">{item.name}</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Book Title</TableHead>
                                        <TableHead>Book ID</TableHead>
                                        <TableHead>Sourcing Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {item.subItems?.map((book, bookIdx) => (
                                        <TableRow key={bookIdx}>
                                            <TableCell className="font-medium">{book.title}</TableCell>
                                            <TableCell className="text-xs font-mono">{book.bookId}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "capitalize",
                                                    book.status === 'sourced' ? "bg-emerald-500" : 
                                                    book.status === 'out_of_stock' ? "bg-rose-500" : 
                                                    book.status === 'unavailable' ? "bg-amber-500" : "bg-slate-400"
                                                )}>
                                                    {book.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Select 
                                                    defaultValue={book.status} 
                                                    onValueChange={(v) => handleBookStatusChange(itemIdx, bookIdx, v)}
                                                    disabled={isUpdating === `${itemIdx}-${bookIdx}`}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="sourced">Sourced</SelectItem>
                                                        <SelectItem value="unavailable">Unavailable</SelectItem>
                                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

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
    const [selectedComboOrder, setSelectedComboOrder] = useState<Order | null>(null);

    const handleSelectAll = (checked: boolean) => {
        orders.forEach(order => onSelectionChange(order.id, checked));
    }
    
    if (orders.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No orders in this category.</p>;
    }

    const allSelected = orders.length > 0 && orders.every(order => selectedOrders.includes(order.id));

    return (
        <div className="overflow-x-auto">
            {selectedComboOrder && (
                <ComboDetailsDialog order={selectedComboOrder} onClose={() => setSelectedComboOrder(null)} />
            )}
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
                        <TableHead>Items & Price</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                            <TableCell className="font-mono text-xs">{order.id.slice(-8)}</TableCell>
                            <TableCell>
                                <div className="font-medium">{order.name}</div>
                                <div className="text-[10px] text-muted-foreground">{order.email}</div>
                                {order.phone && <div className="text-[10px] text-muted-foreground">{order.phone}</div>}
                            </TableCell>
                            <TableCell className="text-[10px] max-w-[200px]">
                                {order.address ? `${order.address}, ${order.street}, ${order.city}, ${order.state}, ${order.country} - ${order.pinCode}` : 'N/A'}
                            </TableCell>
                             <TableCell>
                                <div className="space-y-1">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] uppercase h-4 px-1">
                                                {item.type}
                                            </Badge>
                                            <span className="text-[11px] font-medium line-clamp-1">{item.name}</span>
                                            {item.type === 'combo' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-4 w-4 text-primary" 
                                                    onClick={() => setSelectedComboOrder(order)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="font-bold text-sm mt-1">₹{order.price}</div>
                                {order.discountCode && (
                                     <div className="text-[9px] text-emerald-600 font-bold">
                                        -{order.discountAmount} ({order.discountCode})
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="uppercase font-mono text-[10px]">{order.paymentMethod}</TableCell>
                            <TableCell className="text-center">
                                 <Badge variant="outline" className={cn("capitalize text-white text-[10px]", statusColors[order.status])}>
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Select
                                    defaultValue={order.status}
                                    onValueChange={(value) => onStatusChange(order.userId!, order.id, value as OrderStatus)}
                                >
                                    <SelectTrigger className="w-[120px] ml-auto h-8 text-[10px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">New</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="dispatched">Dispatched</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="breached">Breached</SelectItem>
                                        <SelectItem value="refunded">Refunded</SelectItem>
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

function SettingsManager() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            try {
                const fetchedSettings = await getSettingsAction();
                setSettings(fetchedSettings);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings.' });
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [toast]);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateSettingsAction(settings);
            toast({ title: 'Success', description: 'Settings updated successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFooterLinkChange = (index: number, field: 'label' | 'url', value: string) => {
        setSettings(prev => {
            if (!prev) return null;
            const newLinks = [...prev.footerLinks];
            newLinks[index] = { ...newLinks[index], [field]: value };
            return { ...prev, footerLinks: newLinks };
        });
    };

    const addFooterLink = () => {
        setSettings(prev => {
            if (!prev) return null;
            return { ...prev, footerLinks: [...prev.footerLinks, { label: 'New Link', url: '/' }] };
        });
    };

    const removeFooterLink = (index: number) => {
        setSettings(prev => {
            if (!prev) return null;
            return { ...prev, footerLinks: prev.footerLinks.filter((_, i) => i !== index) };
        });
    };

    if (isLoading || !settings) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings/> General Settings</CardTitle>
                </CardHeader>
                <CardContent><div className="flex justify-center items-center p-4"><Loader2 className="animate-spin" /></div></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings/> General Settings</CardTitle>
                <CardDescription>Manage global site settings, including COD availability and footer links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Checkout Configuration</h3>
                    
                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                        <Switch 
                            id="cod-enabled" 
                            checked={settings.codEnabled}
                            onCheckedChange={(checked) => setSettings(prev => prev ? ({ ...prev, codEnabled: checked }) : null)} 
                        />
                        <div>
                            <Label htmlFor="cod-enabled" className="text-base">Enable COD (India)</Label>
                            <p className="text-sm text-muted-foreground">Allow Cash on Delivery for Indian orders.</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                        <Switch 
                            id="cod-enabled-int" 
                            checked={settings.codEnabledInternational}
                            onCheckedChange={(checked) => setSettings(prev => prev ? ({ ...prev, codEnabledInternational: checked }) : null)} 
                        />
                        <div>
                            <Label htmlFor="cod-enabled-int" className="text-base">Enable COD (International)</Label>
                            <p className="text-sm text-muted-foreground">Allow Cash on Delivery for International orders.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                         <h3 className="text-lg font-medium">Footer Links</h3>
                         <Button size="sm" variant="outline" onClick={addFooterLink}><PlusCircle className="mr-2 h-4 w-4"/> Add Link</Button>
                    </div>
                   
                    <div className="space-y-3">
                        {settings.footerLinks.map((link, index) => (
                            <div key={index} className="flex gap-4 items-center">
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Label</Label>
                                        <Input 
                                            value={link.label} 
                                            onChange={e => handleFooterLinkChange(index, 'label', e.target.value)} 
                                            placeholder="Link Text"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">URL</Label>
                                        <Input 
                                            value={link.url} 
                                            onChange={e => handleFooterLinkChange(index, 'url', e.target.value)} 
                                            placeholder="/path"
                                        />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="mt-5 text-destructive hover:bg-destructive/10" onClick={() => removeFooterLink(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}

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

    const handleDeleteDiscount = async (code: string) => {
        if(!confirm(`Are you sure you want to delete discount code ${code}?`)) return;
        
        try {
            const result = await deleteDiscountAction(code);
            if(result.success) {
                toast({ title: 'Success', description: result.message });
                await loadDiscounts();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete discount.' });
        }
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
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {discounts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No discounts created yet.</TableCell></TableRow>}
                                {discounts.map(d => (
                                    <TableRow key={d.id}>
                                        <TableCell className="font-mono">{d.id}</TableCell>
                                        <TableCell>{d.percent}%</TableCell>
                                        <TableCell className="text-right">{d.usageCount}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDiscount(d.id)} className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
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

function ChapterManager() {
    const { toast } = useToast();
    const [chapters, setChapters] = useState<SampleChapter[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();

    useEffect(() => {
        async function loadChapters() {
            setIsLoading(true);
            try {
                let fetchedChapters = await getChapters();
                if (fetchedChapters.length === 0) {
                    await initializeChapters();
                    fetchedChapters = await getChapters();
                }
                setChapters(fetchedChapters);
            } catch (e) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load chapters.' });
            } finally {
                setIsLoading(false);
            }
        }
        loadChapters();
    }, [toast]);

    const handleChapterChange = (id: string, field: keyof SampleChapter, value: string | boolean) => {
        setChapters(prev => prev!.map(chap => chap.id === id ? { ...chap, [field]: value } : chap));
    };

    const handleSave = (chapter: SampleChapter) => {
        startTransition(async () => {
            try {
                await updateChapterAction(chapter);
                toast({ title: 'Success', description: `Chapter ${chapter.number} updated successfully.` });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: `Failed to update Chapter ${chapter.number}.` });
            }
        });
    };

    if (isLoading || !chapters) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen/> Sample Chapter Management</CardTitle>
                </CardHeader>
                <CardContent><div className="flex justify-center items-center p-4"><Loader2 className="animate-spin" /></div></CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen/> Sample Chapter Management</CardTitle>
                <CardDescription>Edit the content for the sample chapters shown on the homepage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {chapters.map((chapter) => (
                    <Card key={chapter.id}>
                        <CardHeader>
                            <CardTitle>Chapter {chapter.number}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`title-${chapter.id}`}>Title</Label>
                                <Input id={`title-${chapter.id}`} value={chapter.title} onChange={e => handleChapterChange(chapter.id, 'title', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`content-${chapter.id}`}>Content</Label>
                                <Textarea id={`content-${chapter.id}`} value={chapter.content} onChange={e => handleChapterChange(chapter.id, 'content', e.target.value)} rows={5} />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id={`locked-${chapter.id}`} checked={chapter.locked} onCheckedChange={checked => handleChapterChange(chapter.id, 'locked', checked)} />
                                <Label htmlFor={`locked-${chapter.id}`}>{chapter.locked ? 'Locked' : 'Unlocked'}</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                             <Button onClick={() => handleSave(chapter)} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Chapter {chapter.number}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
    );
}

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

  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [dispatchingOrder, setDispatchingOrder] = useState<{id: string, userId: string} | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

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
            setSelectedOrders([]); 
        } catch(e: any) {
            let description = "Failed to load orders. Please try again later.";
            if (e.message && e.message.includes("indexes?create_composite")) {
                 const urlMatch = e.message.match(/(https?:\/\/[^\s]+)/);
                 if (urlMatch) {
                    const firebaseUrl = urlMatch[0].replace(/\\\"/g, '');
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

        const headers = ["Order ID", "Date", "Status", "Name", "Email", "Phone", "Address", "City", "State", "Country", "Pincode", "Variant", "Price", "Payment Method", "Discount Code"];
        
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
    pending: orders.filter(o => o.status === 'pending'),
    dispatched: orders.filter(o => o.status === 'dispatched'),
    delivered: orders.filter(o => o.status === 'delivered'),
    cancelled: orders.filter(o => o.status === 'cancelled'),
    breached: orders.filter(o => o.status === 'breached'),
    refunded: orders.filter(o => o.status === 'refunded')
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
        
        <Tabs defaultValue="operations" className="w-full">
            <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-4xl grid-cols-5">
                    <TabsTrigger value="operations">Operations</TabsTrigger>
                    <TabsTrigger value="shop">Shop</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
            </div>
            
            {/* OPERATIONS TAB */}
            <TabsContent value="operations" className="space-y-6">
                <Tabs defaultValue="orders" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-6">
                        <TabsTrigger value="orders" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Orders</TabsTrigger>
                        <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Users</TabsTrigger>
                        <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">System Logs</TabsTrigger>
                        <TabsTrigger value="support" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Support Chat</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="orders">
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
                                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 h-auto">
                                        <TabsTrigger value="new">New ({categorizedOrders.new.length})</TabsTrigger>
                                        <TabsTrigger value="pending">Pending ({categorizedOrders.pending.length})</TabsTrigger>
                                        <TabsTrigger value="dispatched">Dispatched ({categorizedOrders.dispatched.length})</TabsTrigger>
                                        <TabsTrigger value="delivered">Delivered ({categorizedOrders.delivered.length})</TabsTrigger>
                                        <TabsTrigger value="cancelled">Cancelled ({categorizedOrders.cancelled.length})</TabsTrigger>
                                        <TabsTrigger value="breached">Breached ({categorizedOrders.breached.length})</TabsTrigger>
                                        <TabsTrigger value="refunded">Refunded ({categorizedOrders.refunded.length})</TabsTrigger>
                                    </TabsList>
                                    <BulkActions selectedCount={selectedOrders.length} onAction={handleBulkStatusChange}/>
                                    <TabsContent value="new" className="mt-4">
                                        <OrderTable orders={categorizedOrders.new} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                    <TabsContent value="pending" className="mt-4">
                                        <OrderTable orders={categorizedOrders.pending} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                    <TabsContent value="dispatched" className="mt-4">
                                        <OrderTable orders={categorizedOrders.dispatched} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                    <TabsContent value="delivered" className="mt-4">
                                        <OrderTable orders={categorizedOrders.delivered} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                     <TabsContent value="cancelled" className="mt-4">
                                        <OrderTable orders={categorizedOrders.cancelled} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                    <TabsContent value="breached" className="mt-4">
                                        <OrderTable orders={categorizedOrders.breached} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                    <TabsContent value="refunded" className="mt-4">
                                        <OrderTable orders={categorizedOrders.refunded} onStatusChange={handleStatusChange} selectedOrders={selectedOrders} onSelectionChange={handleSelectionChange}/>
                                    </TabsContent>
                                </Tabs>
                             )}
                          </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="users">
                        <UsersManager orders={orders} />
                    </TabsContent>

                    <TabsContent value="logs">
                        <LogsManager />
                    </TabsContent>

                    <TabsContent value="support">
                        <SupportChatManager />
                    </TabsContent>
                </Tabs>
            </TabsContent>

            {/* SHOP TAB */}
            <TabsContent value="shop" className="space-y-6">
                <ShopManager />
            </TabsContent>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="space-y-6">
                <Tabs defaultValue="blogs" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-6">
                        <TabsTrigger value="blogs" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Blogs</TabsTrigger>
                        <TabsTrigger value="community" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Community</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="blogs">
                        <BlogsManager />
                    </TabsContent>
                    
                    <TabsContent value="community">
                        <CommunityManager />
                    </TabsContent>
                </Tabs>
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6">
                <AnalyticsDashboard />
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-6 overflow-x-auto">
                        <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">General</TabsTrigger>
                        <TabsTrigger value="chapters" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Chapters</TabsTrigger>
                        <TabsTrigger value="stock" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Stock</TabsTrigger>
                        <TabsTrigger value="discounts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Discounts</TabsTrigger>
                        <TabsTrigger value="pricing" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6">Pricing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general">
                        <SettingsManager />
                    </TabsContent>
                    
                    <TabsContent value="chapters">
                        <ChapterManager />
                    </TabsContent>
                    
                    <TabsContent value="stock">
                        <StockManager />
                    </TabsContent>
                    
                    <TabsContent value="discounts">
                        <DiscountManager />
                    </TabsContent>
                    
                    <TabsContent value="pricing">
                        <PricingManager />
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
    </div>
  );
}