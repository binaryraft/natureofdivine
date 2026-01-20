'use client';

import { useState, useEffect, useTransition } from 'react';
import { Product, ShopOrder } from '@/lib/definitions';
import { fetchProductsAction, addProductAction, updateProductAction, deleteProductAction, fetchShopOrdersAction, updateShopOrderStatusAction } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Edit, Trash2, ShoppingBag, Package, RefreshCw, Save, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function ShopManager() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('products');

    // Products State
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isSavingProduct, startProductTransition] = useTransition();
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productFormData, setProductFormData] = useState({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        stock: '',
        isActive: true
    });

    // Orders State
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);
    const [isUpdatingOrder, startOrderTransition] = useTransition();

    // --- Product Handlers ---

    const loadProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const fetched = await fetchProductsAction(false);
            setProducts(fetched);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load products.' });
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleOpenProductDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductFormData({
                name: product.name,
                description: product.description,
                price: product.price.toString(),
                imageUrl: product.imageUrl,
                stock: product.stock.toString(),
                isActive: product.isActive
            });
        } else {
            setEditingProduct(null);
            setProductFormData({
                name: '',
                description: '',
                price: '',
                imageUrl: '',
                stock: '0',
                isActive: true
            });
        }
        setIsProductDialogOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        startProductTransition(async () => {
            try {
                const productData = {
                    name: productFormData.name,
                    description: productFormData.description,
                    price: parseFloat(productFormData.price),
                    imageUrl: productFormData.imageUrl,
                    stock: parseInt(productFormData.stock),
                    isActive: productFormData.isActive
                };

                if (editingProduct) {
                    await updateProductAction({ ...editingProduct, ...productData });
                    toast({ title: 'Success', description: 'Product updated.' });
                } else {
                    await addProductAction(productData);
                    toast({ title: 'Success', description: 'Product added.' });
                }
                setIsProductDialogOpen(false);
                loadProducts();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        startProductTransition(async () => {
            try {
                await deleteProductAction(id);
                toast({ title: 'Success', description: 'Product deleted.' });
                loadProducts();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };

    // --- Order Handlers ---

    const loadOrders = async () => {
        setIsLoadingOrders(true);
        try {
            const fetched = await fetchShopOrdersAction();
            setOrders(fetched);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load orders.' });
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orders') {
            loadOrders();
        }
    }, [activeTab]);

    const handleStatusChange = async (id: string, newStatus: ShopOrder['status']) => {
        startOrderTransition(async () => {
            try {
                await updateShopOrderStatusAction(id, newStatus);
                toast({ title: 'Success', description: 'Order status updated.' });
                loadOrders();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };

    return (
        <Card className="min-h-[600px] bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="border-b border-border/10 pb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-garamond font-bold flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <ShoppingBag className="h-6 w-6" />
                            </div>
                            Shop Management
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">Orchestrate your divine merchandise and fulfill seeker requests.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted/30 p-1">
                        <TabsTrigger value="products" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Products</TabsTrigger>
                        <TabsTrigger value="orders" className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Orders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-6">
                        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border/50">
                            <p className="text-sm font-medium text-muted-foreground">{products.length} Spiritual Artifacts</p>
                            <Button onClick={() => handleOpenProductDialog()} className="shadow-lg hover:shadow-primary/20 transition-all font-bold">
                                <PlusCircle className="mr-2 h-4 w-4" /> New Artifact
                            </Button>
                        </div>

                        {isLoadingProducts ? (
                            <div className="flex justify-center p-20 animate-pulse">
                                <Loader2 className="animate-spin h-10 w-10 text-primary/40" />
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {products.map(product => (
                                    <Card key={product.id} className="overflow-hidden group hover:border-primary/30 transition-all duration-500 bg-background/40">
                                        <div className="aspect-[4/3] relative bg-muted/30 overflow-hidden">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground/30"><Package className="h-12 w-12" /></div>
                                            )}
                                            {!product.isActive && (
                                                <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                                    <Badge variant="secondary" className="font-bold tracking-widest uppercase">Invisible</Badge>
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3">
                                                <Badge className="bg-background/90 text-primary border-primary/20 backdrop-blur-md">₹{product.price}</Badge>
                                            </div>
                                        </div>
                                        <CardHeader className="p-5">
                                            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{product.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 text-xs leading-relaxed">{product.description}</CardDescription>
                                        </CardHeader>
                                        <CardFooter className="p-5 pt-0 flex justify-between items-center border-t border-border/5 mt-2">
                                            <div className="text-xs font-semibold uppercase tracking-tighter opacity-70">
                                                {product.stock > 0 ? (
                                                    <span className="text-emerald-500 flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {product.stock} Units</span>
                                                ) : (
                                                    <span className="text-rose-500">Depleted</span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenProductDialog(product)}><Edit className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="orders">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 py-1 px-4">
                                    {orders.length} Sacred Sequences Received
                                </Badge>
                            </div>
                            <Button variant="outline" size="sm" onClick={loadOrders} disabled={isLoadingOrders} className="hover:bg-primary/5 transition-colors border-primary/20 text-primary font-bold">
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`} /> Refresh Orders
                            </Button>
                        </div>
                        {isLoadingOrders ? (
                            <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary/40" /></div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-primary/10">
                                <Package className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground font-garamond text-xl">No orders found in the sacred scrolls.</p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border/50 overflow-hidden bg-background/30 backdrop-blur-sm shadow-inner">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-border/40">
                                                <TableHead className="font-bold opacity-70">Timestamp</TableHead>
                                                <TableHead className="font-bold opacity-70">Seeker Details</TableHead>
                                                <TableHead className="font-bold opacity-70">Divine Artifacts</TableHead>
                                                <TableHead className="font-bold opacity-70">Offering</TableHead>
                                                <TableHead className="font-bold opacity-70">Existence State</TableHead>
                                                <TableHead className="text-right font-bold opacity-70">Adjustment</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map(order => (
                                                <TableRow key={order.id} className="hover:bg-primary/5 border-border/30 transition-colors group">
                                                    <TableCell className="text-xs font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                                                        {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        <div className="text-[10px] mt-1 uppercase">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-sm tracking-tight">{order.customerName || 'Guest Seeker'}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="h-3 w-3 text-primary/40" /> {order.phoneNumber}</div>
                                                        <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-[180px] mt-0.5 opacity-60" title={`${order.address}, ${order.pincode}`}>
                                                            {order.address}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-sm">{order.productName}</div>
                                                        <div className="text-xs text-primary/80 font-bold bg-primary/5 inline-block px-2 rounded mt-1">Qty: {order.quantity}</div>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-primary">₹{order.totalPrice}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn(
                                                            "capitalize border-none shadow-sm font-bold text-[10px] tracking-widest",
                                                            order.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                                                                order.status === 'dispatched' ? 'bg-amber-500/10 text-amber-500' :
                                                                    order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                        'bg-rose-500/10 text-rose-500'
                                                        )}>
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Select
                                                            defaultValue={order.status}
                                                            onValueChange={(val) => handleStatusChange(order.id, val as ShopOrder['status'])}
                                                        >
                                                            <SelectTrigger className="w-[120px] ml-auto h-9 bg-background/50 border-border/50 focus:ring-primary/20 text-xs font-bold">
                                                                <SelectValue />
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
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-garamond font-bold">{editingProduct ? 'Edit Sacred Artifact' : 'Conjure New Artifact'}</DialogTitle>
                            <DialogDescription>Define the attributes of your spiritual merchandise.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">Artifact Name</Label>
                                <Input id="name" value={productFormData.name} onChange={e => setProductFormData({ ...productFormData, name: e.target.value })} required className="bg-muted/20 border-border/50 focus:ring-primary/20 h-10 px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest">Spiritual Purpose (Description)</Label>
                                <Textarea id="description" value={productFormData.description} onChange={e => setProductFormData({ ...productFormData, description: e.target.value })} required className="bg-muted/20 border-border/50 focus:ring-primary/20 min-h-[100px] px-4 py-3 leading-relaxed" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-bold uppercase tracking-widest">Offering (₹)</Label>
                                    <Input id="price" type="number" value={productFormData.price} onChange={e => setProductFormData({ ...productFormData, price: e.target.value })} required min="0" className="bg-muted/20 border-border/50 focus:ring-primary/20 h-10 px-4" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-widest">Quantity Available</Label>
                                    <Input id="stock" type="number" value={productFormData.stock} onChange={e => setProductFormData({ ...productFormData, stock: e.target.value })} required min="0" className="bg-muted/20 border-border/50 focus:ring-primary/20 h-10 px-4" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-xs font-bold uppercase tracking-widest">Visionary Image URL</Label>
                                <Input id="imageUrl" value={productFormData.imageUrl} onChange={e => setProductFormData({ ...productFormData, imageUrl: e.target.value })} placeholder="https://..." className="bg-muted/20 border-border/50 focus:ring-primary/20 h-10 px-4" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                                <div className="space-y-0.5">
                                    <Label htmlFor="isActive" className="text-sm font-bold">Visible in Realm</Label>
                                    <p className="text-[10px] text-muted-foreground">Should this item be manifest in the seekers' shop?</p>
                                </div>
                                <Switch id="isActive" checked={productFormData.isActive} onCheckedChange={checked => setProductFormData({ ...productFormData, isActive: checked })} />
                            </div>
                            <DialogFooter className="sm:justify-end gap-3 pt-4 border-t border-border/10">
                                <Button type="submit" disabled={isSavingProduct} className="w-full sm:w-auto px-8 font-bold shadow-lg shadow-primary/20">
                                    {isSavingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingProduct ? 'Harmonize Artifact' : 'Manifest Artifact'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
