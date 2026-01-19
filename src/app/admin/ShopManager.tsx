
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
import { Loader2, PlusCircle, Edit, Trash2, ShoppingBag, Package, RefreshCw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        <Card className="min-h-[600px]">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShoppingBag/> Shop Management</CardTitle>
                <CardDescription>Manage products and view shop orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => handleOpenProductDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Add Product
                            </Button>
                        </div>

                        {isLoadingProducts ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {products.map(product => (
                                    <Card key={product.id} className="overflow-hidden">
                                        <div className="aspect-square relative bg-muted">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground"><Package className="h-8 w-8"/></div>
                                            )}
                                            {!product.isActive && (
                                                <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">INACTIVE</div>
                                            )}
                                        </div>
                                        <CardHeader className="p-4">
                                            <CardTitle className="text-lg">{product.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span>₹{product.price}</span>
                                                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 bg-muted/20 flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenProductDialog(product)}><Edit className="h-4 w-4"/></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="orders">
                        <div className="flex justify-end mb-4">
                             <Button variant="outline" size="sm" onClick={loadOrders} disabled={isLoadingOrders}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrders ? 'animate-spin' : ''}`}/> Refresh
                            </Button>
                        </div>
                        {isLoadingOrders ? (
                             <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div>
                        ) : orders.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No orders yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{order.customerName || 'Guest'}</div>
                                                    <div className="text-xs text-muted-foreground">{order.phoneNumber}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]" title={`${order.address}, ${order.pincode}`}>{order.address}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>{order.productName}</div>
                                                    <div className="text-xs text-muted-foreground">Qty: {order.quantity}</div>
                                                </TableCell>
                                                <TableCell>₹{order.totalPrice}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`capitalize ${
                                                        order.status === 'new' ? 'bg-blue-500 text-white' :
                                                        order.status === 'dispatched' ? 'bg-yellow-500 text-white' :
                                                        order.status === 'delivered' ? 'bg-green-500 text-white' :
                                                        'bg-red-500 text-white'
                                                    }`}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Select
                                                        defaultValue={order.status}
                                                        onValueChange={(val) => handleStatusChange(order.id, val as ShopOrder['status'])}
                                                    >
                                                        <SelectTrigger className="w-[130px] ml-auto h-8 text-xs">
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
                        )}
                    </TabsContent>
                </Tabs>

                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={productFormData.description} onChange={e => setProductFormData({...productFormData, description: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (₹)</Label>
                                    <Input id="price" type="number" value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: e.target.value})} required min="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stock">Stock</Label>
                                    <Input id="stock" type="number" value={productFormData.stock} onChange={e => setProductFormData({...productFormData, stock: e.target.value})} required min="0" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL</Label>
                                <Input id="imageUrl" value={productFormData.imageUrl} onChange={e => setProductFormData({...productFormData, imageUrl: e.target.value})} placeholder="https://..." />
                            </div>
                            <div className="flex items-center space-x-2 pt-4">
                                <Switch id="isActive" checked={productFormData.isActive} onCheckedChange={checked => setProductFormData({...productFormData, isActive: checked})} />
                                <Label htmlFor="isActive">Active (Visible in Shop)</Label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSavingProduct}>
                                    {isSavingProduct && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save Product
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
